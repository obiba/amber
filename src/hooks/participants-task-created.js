// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('../logger');
const { Parser } = require('@json2csv/plainjs');
const { MailBuilder } = require('../utils/mail');

class ParticipantsNotifications {
  constructor(app) {
    this.app = app;
  }

  async sendInit(task) {
    try {
      const itwdResult = await this.app.service('interview-design')
        .find({
          query: {
            $limit: this.app.get('paginate').max,
            state: 'active'
          }
        });
      if (itwdResult.total > 0) {
        for (const itwd of itwdResult.data) {
          const study = await this.app.service('study').get(itwd.study);
          await this.scanCampaignsForParticipantInit(study, itwd);
        }
      }
      this.app.service('task').patch(task._id, {
        state: 'completed'
      });
    } catch(err) {
      this.app.service('task').patch(task._id, {
        error: err.message,
        state: 'completed'
      });
    }
  }
  
  async scanCampaignsForParticipantInit(study, interviewDesign) {
    const campaignsResult = await this.app.service('campaign')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          interviewDesign: interviewDesign._id.toString()
        }
      });
    if (campaignsResult.total > 0) {
      for (const campaign of campaignsResult.data.filter(this.isCampaignValid)) {
        await this.scanParticipantsForInit(study, interviewDesign, campaign);
      }
    }
  }

  async scanParticipantsForInit(study, interviewDesign, campaign) {
    const initDate = new Date();
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: true,
          campaign: campaign._id.toString(),
          initAt: { $exists: false }
        }
      });
    if (participantsResult.total > 0) {
      // participants list as a csv file
      const participants = participantsResult.data.filter(this.isParticipantValid);
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
        .patch(null, { initAt: initDate }, { query: { _id: { $in: ids }}});
    }
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
    if (context.result.type === 'participants-init') {
      const result = await context.app.service('task').find({
        query: {
          $limit: 1,
          type: context.result.type,
          state: 'in_progress',
          _id: { $ne: context.result._id } // do not find itself!
        }
      });
      if (result.total > 0) {
        context.app.service('task').patch(context.result._id.toString(), {
          error: 'Another participants init task is in progress',
          state: 'aborted'
        });
      } else {
        const notifications = new ParticipantsNotifications(context.app);
        notifications.sendInit(context.result);
      }
    }
    return context;
  };
};
