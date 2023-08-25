// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
// eslint-disable-next-line no-unused-vars
const logger = require('../logger');
const { Parser } = require('@json2csv/plainjs');
const { MailBuilder } = require('../utils/mail');

class ParticipantsTasksHandler {
  constructor(app) {
    this.app = app;
  }

  async process(task) {
    try {
      if (task.type === 'participants-init') {
        await this.sendInit(task);
      } else if (task.type === 'participants-reminder') {
        await this.sendReminders(task);
      } else if (task.type === 'participants-expired') {
        await this.deactivate(task);
      }
    } catch(err) {
      this.app.service('task').patch(task._id, {
        error: err.message,
        state: 'aborted'
      });
    }
  }

  async sendInit(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantInit(study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async sendReminders(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantReminders(study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async deactivate(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantDeactivation(study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }
  
  async scanCampaignsForParticipantInit(study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(interviewDesign);
    for (const campaign of campaigns) {
      await this.scanParticipantsForInit(study, interviewDesign, campaign);
    }
  }

  async scanCampaignsForParticipantReminders(study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(interviewDesign);
    for (const campaign of campaigns) {
      await this.scanParticipantsForReminders(study, interviewDesign, campaign);
    }
  }
  
  async scanCampaignsForParticipantDeactivation(study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(interviewDesign);
    for (const campaign of campaigns) {
      await this.scanParticipantsForDeactivation(study, interviewDesign, campaign);
    }
  }

  async scanParticipantsForInit(study, interviewDesign, campaign) {
    const now = new Date();
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: true,
          campaign: campaign._id.toString(),
          initAt: { $exists: false }
        }
      });
    const participants = participantsResult.data.filter(this.isParticipantValid);
    if (participants.length > 0) {
      // participants list as a csv file
      const csv = this.toParticipantsCSV(participants);
      // send mail to each investigator
      const builder = new MailBuilder(this.app);
      for (const investigator of campaign.investigators) {
        // recipient
        const user = await this.app.service('user').get(investigator);
        const context = { // TODO translate
          study: study.name,
          interview: interviewDesign.name,
          campaign: campaign.name,
          attachments: [
            {
              filename: 'participants.csv',
              contentType: 'text/plain',
              content: csv
            }
          ]
        };
        builder.sendEmail('initParticipants', user, context);
      }
      // set participants init date
      const ids = participants.map((participant) => participant._id);
      await this.app.service('participant')
        .patch(null, { initAt: now }, { query: { _id: { $in: ids }}});
      logger.info(`Initialized participants: ${participants.map(p => p.code).join(', ')}`);
    }
  }

  async scanParticipantsForReminders(study, interviewDesign, campaign) {
    const now = new Date();
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: true, // if the interview was completed, the participant is inactive
          campaign: campaign._id.toString(),
          initAt: { $exists: true }
        }
      });
    const participants = participantsResult.data
      .filter(this.isParticipantValid)
      .filter((p) => this.isTimeToRemind(p, campaign, now));
    if (participants.length > 0) {
      // notify by reminder occurrences
      for (let i = 0; i < campaign.numberOfReminders; i++) {
        // filter by reminders count and send
        const participantsToRemind = participants
          .filter((p) => p.reminders.length === i);
        if (participantsToRemind.length > 0) {
          // participants list as a csv file
          const csv = this.toParticipantsCSV(participantsToRemind);
          // send mail to each investigator
          const builder = new MailBuilder(this.app);
          for (const investigator of campaign.investigators) {
            // recipient
            const user = await this.app.service('user').get(investigator);
            const context = { // TODO translate
              study: study.name,
              interview: interviewDesign.name,
              campaign: campaign.name,
              reminder: i + 1,
              attachments: [
                {
                  filename: 'participants.csv',
                  contentType: 'text/plain',
                  content: csv
                }
              ]
            };
            builder.sendEmail('remindParticipants', user, context);
          }
          // set participants reminder date
          for (const participant of participantsToRemind) {
            const reminders = [...participant.reminders];
            reminders.push(now);
            await this.app.service('participant')
              .patch(participant._id, { reminders: reminders });
          }
          logger.info(`Reminded participants: ${participantsToRemind.map(p => p.code).join(', ')}`);
        }
      }
    }
  }

  async scanParticipantsForDeactivation(study, interviewDesign, campaign) {
    const now = new Date();
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: true,
          campaign: campaign._id.toString(),
          initAt: { $exists: true }
        }
      });
    const participants = participantsResult.data
      .filter((p) => this.isTimeToExpire(p, campaign, now));
    if (participants.length > 0) {
      // set participants inactive
      const ids = participants.map((participant) => participant._id);
      await this.app.service('participant')
        .patch(null, { activated: false }, { query: { _id: { $in: ids }}});
      logger.info(`Deactivated participants: ${participants.map(p => p.code).join(', ')}`);
    }
  }

  // eslint-disable-next-line no-unused-vars
  async findActiveInterviewDesigns(task) {
    const itwdResult = await this.app.service('interview-design')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          state: 'active'
        }
      });
    return itwdResult.data;
  }

  async findValidCampaigns(interviewDesign) {
    const campaignsResult = await this.app.service('campaign')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          interviewDesign: interviewDesign._id.toString()
        }
      });
    return campaignsResult.data.filter(this.isCampaignValid);
  }

  isTimeToRemind(participant, campaign, now) {
    // time between last reminder or from init date
    const delayMillis = campaign.weeksBetweenReminders * 7 * 24 * 60 * 60 * 1000;
    if (participant.reminders.length === 0) {
      return now.getTime() > participant.initAt.getTime() + delayMillis;
    } else {
      const lastRemind = participant.reminders[participant.reminders.length - 1];
      return now.getTime() > lastRemind.getTime() + delayMillis;
    }
  }

  isTimeToExpire(participant, campaign, now) {
    // time between last reminder or from init date
    const delayMillis = campaign.weeksToDeactivate * 7 * 24 * 60 * 60 * 1000;
    return now.getTime() > participant.initAt.getTime() + delayMillis;
  }

  /**
   * Make a CSV string from a participants array.
   * @param {Array} participants 
   * @returns 
   */
  toParticipantsCSV(participants) {
    const headerRows = {
      header: ['code', 'identifier'],
      rows: [],
    };
    if (participants) {
      const keys = participants
        .filter(participant => participant.data)
        .flatMap(participant => Object.keys(participant.data))
        .filter((value, index, array) => array.indexOf(value) === index);
      headerRows.header.push(keys);
      headerRows.header = headerRows.header.flat();
      headerRows.rows = participants.map(datum => {
        const value = { ...datum, ...datum.data };
        delete value.data;
        return value;
      });
    }
    const csv = new Parser({ fields: headerRows.header }).parse(headerRows.rows);
    return csv;
  }

  /**
   * Check campaign time interval.
   * @param {Object} campaign 
   * @returns 
   */
  isCampaignValid(campaign) {
    const now = new Date().getTime();
    return (!campaign.validFrom || campaign.validFrom === null || campaign.validFrom.getTime() < now)
      && (!campaign.validUntil || campaign.validUntil === null || campaign.validUntil.getTime() > now);
  }

  /**
   * Check participant time interval.
   * @param {Object} participant 
   * @returns 
   */
  isParticipantValid(participant) {
    const now = new Date().getTime();
    return (!participant.validFrom || participant.validFrom === null || participant.validFrom.getTime() < now)
      && (!participant.validUntil || participant.validUntil === null || participant.validUntil.getTime() > now);
  }
  
}

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const task = context.result;
    // make sure there is only one task of same type that is in progress
    const result = await context.app.service('task').find({
      query: {
        $limit: 1,
        type: task.type,
        state: 'in_progress',
        _id: { $ne: task._id } // do not find itself!
      }
    });
    if (result.total > 0) {
      context.app.service('task').patch(task._id, {
        error: `Another "${task.type}" task is in progress`,
        state: 'aborted'
      });
    } else {
      const handler = new ParticipantsTasksHandler(context.app);
      handler.process(task);
    }
    
    return context;
  };
};
