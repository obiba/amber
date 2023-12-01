const logger = require('../../logger');
const { Parser } = require('@json2csv/plainjs');
const { MailBuilder } = require('../../utils/mail');

exports.ParticipantsTasksHandler = class ParticipantsTasksHandler {
  constructor(app) {
    this.app = app;
  }

  async process(task) {
    try {
      if (task.type === 'participants-info-activate') {
        await this.sendInfoBeforeActivation(task);
      }else if (task.type === 'participants-activate') {
        await this.sendInit(task);
      } else if (task.type === 'participants-reminder') {
        await this.sendReminders(task);
      } else if (task.type === 'participants-info-expire') {
        await this.sendInfoBeforeDeactivation(task);
      } else if (task.type === 'participants-deactivate') {
        await this.deactivate(task);
      } else if (task.type === 'participants-summary') {
        await this.summary(task);
      }
    } catch(err) {
      this.app.service('task').patch(task._id, {
        error: err.message,
        state: 'aborted'
      });
    }
  }

  async sendInfoBeforeActivation(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantInfoBeforeActivation(task, study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async sendInit(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantInit(task, study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async sendReminders(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantReminders(task, study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async sendInfoBeforeDeactivation(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantInfoBeforeDeactivation(task, study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async deactivate(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantDeactivation(task, study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }
  
  async summary(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      await this.scanCampaignsForParticipantSummary(task, study, itwd);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed'
    });
  }

  async scanCampaignsForParticipantInfoBeforeActivation(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    for (const campaign of campaigns) {
      if (campaign.weeksInfoBeforeActivation > 0) {
        await this.scanParticipantsForInfoBeforeActivation(task, study, interviewDesign, campaign);
      }
    }
  }

  async scanCampaignsForParticipantInit(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    for (const campaign of campaigns) {
      await this.scanParticipantsForInit(task, study, interviewDesign, campaign);
    }
  }

  async scanCampaignsForParticipantReminders(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    for (const campaign of campaigns) {
      if (campaign.numberOfReminders > 0) {
        await this.scanParticipantsForReminders(task, study, interviewDesign, campaign);
      }
    }
  }

  async scanCampaignsForParticipantInfoBeforeDeactivation(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    for (const campaign of campaigns) {
      if (campaign.weeksInfoBeforeDeactivation > 0) {
        await this.scanParticipantsForInfoBeforeDeactivation(task, study, interviewDesign, campaign);
      }
    }
  }
  
  async scanCampaignsForParticipantDeactivation(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    for (const campaign of campaigns) {
      await this.scanParticipantsForDeactivation(task, study, interviewDesign, campaign);
    }
  }

  async scanCampaignsForParticipantSummary(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    for (const campaign of campaigns) {
      await this.scanParticipantsForSummary(task, study, interviewDesign, campaign);
    }
  }

  async scanParticipantsForInfoBeforeActivation(study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: false,
          validFrom: { $exists: true },
          campaign: campaign._id.toString(),
          initAt: { $exists: false }
        }
      });
    const participants = participantsResult.data
      .filter((p) => p.identifier && p.validFrom.getTime() > now) // only participants with identifier and a future start date
      .filter((p) => this.isTimeToInformBeforeActivate(p, campaign, now));
    if (participants.length > 0) {
      // notify by reminder occurrences
      for (let i = 0; i < campaign.numberOfReminders; i++) {
        // filter by reminders count and send
        const participantsToRemind = participants
          .filter((p) => p.reminders === undefined || p.reminders.length === 0);
        if (participantsToRemind.length > 0) {
          // participants list as a csv file
          const csv = this.toParticipantsCSV(participantsToRemind, undefined);
          // send mail to each investigator
          const builder = new MailBuilder(this.app);
          for (const investigator of campaign.investigators) {
            // recipient
            const user = await this.app.service('user').get(investigator);
            const context = { // TODO translate
              study: study.name,
              interview: interviewDesign.name,
              campaign: campaign.name,
              study_id: study._id.toString(),
              interview_id: interviewDesign._id.toString(),
              campaign_id: campaign._id.toString(),
              amber_visit_url: visitUrl,
              weeksInfoBeforeDeactivation: campaign.weeksInfoBeforeDeactivation,
              attachments: [
                {
                  filename: 'participants.csv',
                  contentType: 'text/plain',
                  content: csv
                }
              ]
            };
            builder.sendEmail('infoParticipantsAboutToExpire', user, context);
          }
          // set participants reminder date
          for (const participant of participantsToRemind) {
            const reminders = [{
              type: 'participants-info-activate',
              date: now
            }];
            await this.app.service('participant')
              .patch(participant._id, { reminders: reminders });
          }
          logger.info(`Reminded participants about to expire: ${participantsToRemind.map(p => p.code).join(', ')}`);
        }
      }
    }
  }

  async scanParticipantsForInit(task, study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
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
      const csv = this.toParticipantsCSV(participants, visitUrl);
      // send mail to each investigator
      const builder = new MailBuilder(this.app);
      for (const investigator of campaign.investigators) {
        // recipient
        const user = await this.app.service('user').get(investigator);
        const context = { // TODO translate
          study: study.name,
          interview: interviewDesign.name,
          campaign: campaign.name,
          study_id: study._id.toString(),
          interview_id: interviewDesign._id.toString(),
          campaign_id: campaign._id.toString(),
          amber_visit_url: visitUrl,
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
    const visitUrl = this.getAmberVisitUrl(campaign);
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
          const csv = this.toParticipantsCSV(participantsToRemind, visitUrl);
          // send mail to each investigator
          const builder = new MailBuilder(this.app);
          for (const investigator of campaign.investigators) {
            // recipient
            const user = await this.app.service('user').get(investigator);
            const context = { // TODO translate
              study: study.name,
              interview: interviewDesign.name,
              campaign: campaign.name,
              study_id: study._id.toString(),
              interview_id: interviewDesign._id.toString(),
              campaign_id: campaign._id.toString(),
              amber_visit_url: visitUrl,
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
            reminders.push({
              type: 'participants-reminder',
              date: now
            });
            await this.app.service('participant')
              .patch(participant._id, { reminders: reminders });
          }
          logger.info(`Reminded participants: ${participantsToRemind.map(p => p.code).join(', ')}`);
        }
      }
    }
  }

  async scanParticipantsForInfoBeforeDeactivation(study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
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
      .filter((p) => this.isTimeToInformBeforeExpire(p, campaign, now));
    if (participants.length > 0) {
      // notify by reminder occurrences
      for (let i = 0; i < campaign.numberOfReminders; i++) {
        // filter by reminders count and send
        const participantsToRemind = participants
          .filter((p) => p.reminders.length === i);
        if (participantsToRemind.length > 0) {
          // participants list as a csv file
          const csv = this.toParticipantsCSV(participantsToRemind, visitUrl);
          // send mail to each investigator
          const builder = new MailBuilder(this.app);
          for (const investigator of campaign.investigators) {
            // recipient
            const user = await this.app.service('user').get(investigator);
            const context = { // TODO translate
              study: study.name,
              interview: interviewDesign.name,
              campaign: campaign.name,
              study_id: study._id.toString(),
              interview_id: interviewDesign._id.toString(),
              campaign_id: campaign._id.toString(),
              amber_visit_url: visitUrl,
              weeksInfoBeforeDeactivation: campaign.weeksInfoBeforeDeactivation,
              attachments: [
                {
                  filename: 'participants.csv',
                  contentType: 'text/plain',
                  content: csv
                }
              ]
            };
            builder.sendEmail('infoParticipantsAboutToExpire', user, context);
          }
          // set participants reminder date
          for (const participant of participantsToRemind) {
            const reminders = [...participant.reminders];
            reminders.push({
              type: 'participants-info-expire',
              date: now
            });
            await this.app.service('participant')
              .patch(participant._id, { reminders: reminders });
          }
          logger.info(`Reminded participants about to expire: ${participantsToRemind.map(p => p.code).join(', ')}`);
        }
      }
    }
  }

  getAmberVisitUrl(campaign) {
    let visitUrl = campaign.visitUrl || this.app.get('amber_visit_url');
    if (!visitUrl.endsWith('/')) {
      visitUrl += '/';
    }
    return visitUrl;
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

  async scanParticipantsForSummary(task, study, interviewDesign, campaign) {
    // get completed interviews
    const interviewsResult = await this.app.service('interview')
      .find({
        query: { // TODO additional query params, e.g. filter by updatedAt for recent changes
          $limit: this.app.get('paginate').max,
          campaign: campaign._id.toString()
        }
      });
    const interviews = interviewsResult.data;
    if (interviews.length > 0) {
      const attachments = [];
      const itwInProgress = interviews.filter((itw) => itw.state === 'in_progress');
      if (itwInProgress.length > 0) {
        const csvInProgress = this.toInterviewsCSV(itwInProgress);
        attachments.push({
          filename: 'interviews_in_progress.csv',
          contentType: 'text/plain',
          content: csvInProgress
        });
      }
      const itwCompleted = interviews.filter((itw) => itw.state === 'completed');
      if (itwCompleted.length > 0) {
        const csvCompleted = this.toInterviewsCSV(itwCompleted);
        attachments.push({
          filename: 'interviews_completed.csv',
          contentType: 'text/plain',
          content: csvCompleted
        });
      }
      // send mail to each investigator
      const builder = new MailBuilder(this.app);
      for (const investigator of campaign.investigators) {
        // recipient
        const user = await this.app.service('user').get(investigator);
        const context = { // TODO translate
          study: study.name,
          interview: interviewDesign.name,
          campaign: campaign.name,
          study_id: study._id.toString(),
          interview_id: interviewDesign._id.toString(),
          campaign_id: campaign._id.toString(),
          inProgress: itwInProgress.length,
          completed: itwCompleted.length,
          attachments: attachments
        };
        builder.sendEmail('summaryParticipants', user, context);
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  async findActiveInterviewDesigns(task) {
    const itwdResult = await this.app.service('interview-design')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          state: 'active',
          ...task.arguments.interviewDesign
        }
      });
    return itwdResult.data;
  }

  async findValidCampaigns(task, interviewDesign) {
    const campaignsResult = await this.app.service('campaign')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          interviewDesign: interviewDesign._id.toString(),
          ...task.arguments.campaign
        }
      });
    return campaignsResult.data.filter(this.isCampaignValid);
  }

  isTimeToRemind(participant, campaign, now) {
    if (campaign.weeksBetweenReminders <= 0) {
      return false;
    }
    // time between last reminder or from init date
    const delayMillis = campaign.weeksBetweenReminders * 7 * 24 * 60 * 60 * 1000;
    if (participant.reminders === undefined || participant.reminders.length === 0) {
      // never been reminded
      return now.getTime() > participant.initAt.getTime() + delayMillis;
    } else if (participant.reminders.find((r) => r.type === 'participants-info-expire') === undefined) {
      // no expiration reminder must have been sent
      const lastRemind = participant.reminders[participant.reminders.length - 1];
      return now.getTime() > lastRemind.getTime() + delayMillis;
    }
    return false;
  }

  isTimeToInformBeforeActivate(participant, campaign, now) {
    if (campaign.weeksInfoBeforeActivation <= 0) {
      return false;
    }
    // time of weeks before activation
    const delayMillis = (campaign.weeksInfoBeforeActivation) * 7 * 24 * 60 * 60 * 1000;
    if (now.getTime() > participant.validFrom.getTime() - delayMillis) {
      // no activation notification must have been sent
      return participant.reminders === undefined || participant.reminders.find((r) => r.type === 'participants-info-activate') === undefined;
    }
    return false;
  }

  isTimeToInformBeforeExpire(participant, campaign, now) {
    if (campaign.weeksInfoBeforeDeactivation <= 0) {
      return false;
    }
    // time from init date to weeks before deactivation
    const delayMillis = (campaign.weeksToDeactivate - campaign.weeksInfoBeforeDeactivation) * 7 * 24 * 60 * 60 * 1000;
    if (now.getTime() > participant.initAt.getTime() + delayMillis) {
      // no expiration notification must have been sent
      return participant.reminders === undefined || participant.reminders.find((r) => r.type === 'participants-info-expire') === undefined;
    }
    return false;
  }

  isTimeToExpire(participant, campaign, now) {
    // time from init date
    const delayMillis = campaign.weeksToDeactivate * 7 * 24 * 60 * 60 * 1000;
    return now.getTime() > participant.initAt.getTime() + delayMillis;
  }

  /**
   * Make a CSV string from a participants array.
   * @param {Array} participants 
   * @param {string} visitUrl 
   * @returns The csv string
   */
  toParticipantsCSV(participants, visitUrl) {
    const headerRows = {
      header: visitUrl ? ['code', 'identifier'] : ['identifier'],
      rows: [],
    };
    if (participants) {
      if (visitUrl) {
        headerRows.header.push('url');
      }
      const keys = participants
        .filter(participant => participant.data)
        .flatMap(participant => Object.keys(participant.data))
        .filter((value, index, array) => array.indexOf(value) === index);
      headerRows.header.push(keys);
      headerRows.header = headerRows.header.flat();
      headerRows.rows = participants.map(datum => {
        const value = { ...datum, ...datum.data };
        delete value.data;
        if (visitUrl) {
          value.url = `${visitUrl}go/${datum.code}`;
        }
        return value;
      });
    }
    const csv = new Parser({ fields: headerRows.header, delimiter: ';' }).parse(headerRows.rows);
    return csv;
  }

  /**
     * Make a CSV string from an interviews array.
     * @param {Array} interviews
     * @returns The csv string
     */
  toInterviewsCSV(interviews) {
    const headerRows = {
      header: ['code', 'identifier', 'updatedAt'],
      rows: [],
    };
    if (interviews.length > 0) {
      const csv = new Parser({ fields: headerRows.header }).parse(interviews);
      return csv;
    }
    return undefined;
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
};
