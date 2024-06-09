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
        state: 'aborted',
        logs: [{ level: 'error', message: err.message, timestamp: Date.now() }]
      });
    }
  }

  async sendInfoBeforeActivation(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    const logs = [];
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      const itwdLogs = await this.scanCampaignsForParticipantInfoBeforeActivation(task, study, itwd);
      logs.push(...itwdLogs);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed',
      logs: logs
    });
  }

  async sendInit(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    const logs = [];
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      const itwdLogs = await this.scanCampaignsForParticipantInit(task, study, itwd);
      logs.push(...itwdLogs);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed',
      logs: logs
    });
  }

  async sendReminders(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    const logs = [];
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      const itwdLogs = await this.scanCampaignsForParticipantReminders(task, study, itwd);
      logs.push(...itwdLogs);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed',
      logs: logs
    });
  }

  async sendInfoBeforeDeactivation(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    const logs = [];
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      const itwdLogs = await this.scanCampaignsForParticipantInfoBeforeDeactivation(task, study, itwd);
      logs.push(...itwdLogs);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed',
      logs: logs
    });
  }

  async deactivate(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    const logs = [];
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      const itwdLogs = await this.scanCampaignsForParticipantDeactivation(task, study, itwd);
      logs.push(...itwdLogs);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed',
      logs: logs
    });
  }

  async summary(task) {
    const itwds = await this.findActiveInterviewDesigns(task);
    const logs = [];
    for (const itwd of itwds) {
      const study = await this.app.service('study').get(itwd.study);
      const itwdLogs = await this.scanCampaignsForParticipantSummary(task, study, itwd);
      logs.push(...itwdLogs);
    }
    this.app.service('task').patch(task._id, {
      state: 'completed',
      logs: logs
    });
  }

  async scanCampaignsForParticipantInfoBeforeActivation(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    const logs = [];
    for (const campaign of campaigns) {
      if (campaign.weeksInfoBeforeActivation > 0) {
        const campaignLogs = await this.scanParticipantsForInfoBeforeActivation(study, interviewDesign, campaign);
        logs.push(...campaignLogs);
      }
    }
    return logs;
  }

  async scanCampaignsForParticipantInit(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    const logs = [];
    for (const campaign of campaigns) {
      const campaignLogs = await this.scanParticipantsForInit(study, interviewDesign, campaign);
      logs.push(...campaignLogs);
    }
    return logs;
  }

  async scanCampaignsForParticipantReminders(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    const logs = [];
    for (const campaign of campaigns) {
      if (campaign.numberOfReminders > 0) {
        const campaignLogs = await this.scanParticipantsForReminders(study, interviewDesign, campaign);
        logs.push(...campaignLogs);
      }
    }
    return logs;
  }

  async scanCampaignsForParticipantInfoBeforeDeactivation(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    const logs = [];
    for (const campaign of campaigns) {
      if (campaign.weeksInfoBeforeDeactivation > 0) {
        const campaignLogs = await this.scanParticipantsForInfoBeforeDeactivation(study, interviewDesign, campaign);
        logs.push(...campaignLogs);
      }
    }
    return logs;
  }

  async scanCampaignsForParticipantDeactivation(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    const logs = [];
    for (const campaign of campaigns) {
      const campaignLogs = await this.scanParticipantsForDeactivation(study, interviewDesign, campaign);
      logs.push(...campaignLogs);
    }
    return logs;
  }

  async scanCampaignsForParticipantSummary(task, study, interviewDesign) {
    const campaigns = await this.findValidCampaigns(task, interviewDesign);
    const logs = [];
    for (const campaign of campaigns) {
      const campaignLogs = await this.scanParticipantsForSummary(study, interviewDesign, campaign);
      logs.push(...campaignLogs);
    }
    return logs;
  }

  async scanParticipantsForInfoBeforeActivation(study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
    const logs = [];
    const campaignFullName = `${study.name}/${interviewDesign.name}/${campaign.name}`;
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: false,
          validFrom: { $exists: true }, // has a start date
          campaign: campaign._id.toString(),
          initAt: { $exists: false } // not initialized yet
        }
      });
    const participants = participantsResult.data
      .filter((p) => p.identifier && p.validFrom.getTime() > now.getTime()) // only participants with identifier and a future start date
      .filter((p) => this.isTimeToInformBeforeActivate(p, campaign, now));
    if (participants.length > 0) {
      // participants list as a csv file
      const csv = this.toParticipantsCSV(participants, undefined);
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
          weeksInfoBeforeActivation: campaign.weeksInfoBeforeActivation,
          attachments: [
            {
              filename: `participants${this.getExtension()}`,
              contentType: 'text/plain',
              content: csv
            }
          ]
        };
        builder.sendEmail('infoParticipantsAboutToInit', user, context);
      }
      // set participants reminder date
      for (const participant of participants) {
        const reminder = {
          type: 'participants-info-activate',
          date: now
        };
        const reminders = participant.reminders ? [...participant.reminders, reminder] : [reminder];
        await this.app.service('participant')
          .patch(participant._id, { reminders: reminders });
      }
      logger.info(`[Task] Reminded participants about to init: ${participants.map(p => p.code).join(', ')}`);
      logs.push({
        level: 'info',
        message: `Found ${participants.length} participants about to init for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    } else {
      logs.push({
        level: 'info',
        message: `No participants before activation found for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    }
    return logs;
  }

  async scanParticipantsForInit(study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
    const logs = [];
    const campaignFullName = `${study.name}/${interviewDesign.name}/${campaign.name}`;
    const participantsResult = await this.app.service('participant')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          activated: true,
          campaign: campaign._id.toString(),
          initAt: { $exists: false }
        }
      });
    const participants = participantsResult.data.filter(this.isParticipantInValidRange);
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
              filename: `participants${this.getExtension()}`,
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
      logger.info(`[Task] Initialized participants: ${participants.map(p => p.code).join(', ')}`);
      logs.push({
        level: 'info',
        message: `Found ${participants.length} participants to init for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    } else {
      logs.push({
        level: 'info',
        message: `No participants to init found for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    }
    return logs;
  }

  async scanParticipantsForReminders(study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
    const logs = [];
    const campaignFullName = `${study.name}/${interviewDesign.name}/${campaign.name}`;
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
      .filter(this.isParticipantInValidRange)
      .filter((p) => this.isTimeToRemind(p, campaign, now));
    if (participants.length > 0) {
      // notify by reminder occurrences
      for (let i = 0; i < campaign.numberOfReminders; i++) {
        // filter by reminders count and send
        const participantsToRemind = participants
          .filter((p) => {
            // exclude the reminder that participant is about to be initialized
            const reminders = p.reminders === undefined ? [] : p.reminders.filter((r) => r.type !== 'participants-info-activate');
            return reminders.length === i;
          });
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
                  filename: `participants${this.getExtension()}`,
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
          logger.info(`[Task] Reminded participants: ${participantsToRemind.map(p => p.code).join(', ')}`);
          logs.push({
            level: 'info',
            message: `Found ${participantsToRemind.length} participants to remind for reminder ${i + 1} for campaign: ${campaignFullName}`,
            timestamp: Date.now()
          });
        } else {
          logs.push({
            level: 'info',
            message: `No participants to remind for reminder ${i + 1} found for campaign: ${campaignFullName}`,
            timestamp: Date.now()
          });
        }
      }
    } else {
      logs.push({
        level: 'info',
        message: `No participants to remind found for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    }
    return logs;
  }

  async scanParticipantsForInfoBeforeDeactivation(study, interviewDesign, campaign) {
    const now = new Date();
    const visitUrl = this.getAmberVisitUrl(campaign);
    const logs = [];
    const campaignFullName = `${study.name}/${interviewDesign.name}/${campaign.name}`;
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
      .filter(this.isParticipantInValidRange)
      .filter((p) => this.isTimeToInformBeforeExpire(p, campaign, now));
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
          weeksInfoBeforeDeactivation: campaign.weeksInfoBeforeDeactivation,
          attachments: [
            {
              filename: `participants${this.getExtension()}`,
              contentType: 'text/plain',
              content: csv
            }
          ]
        };
        builder.sendEmail('infoParticipantsAboutToExpire', user, context);
      }
      // set participants reminder date
      for (const participant of participants) {
        const reminders = [...participant.reminders];
        reminders.push({
          type: 'participants-info-expire',
          date: now
        });
        await this.app.service('participant')
          .patch(participant._id, { reminders: reminders });
      }
      logger.info(`[Task] Reminded participants about to expire: ${participants.map(p => p.code).join(', ')}`);
      logs.push({
        level: 'info',
        message: `Found ${participants.length} participants about to expire for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    } else {
      logs.push({
        level: 'info',
        message: `No participants before deactivation found for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    }
    return logs;
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
    const logs = [];
    const campaignFullName = `${study.name}/${interviewDesign.name}/${campaign.name}`;
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
      logger.info(`[Task] Deactivated participants: ${participants.map(p => p.code).join(', ')}`);
      logs.push({
        level: 'info',
        message: `Found ${participants.length} participants to deactivate for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    } else {
      logs.push({
        level: 'info',
        message: `No participants to deactivate found for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    }
    return logs;
  }

  async scanParticipantsForSummary(study, interviewDesign, campaign) {
    // get completed interviews
    const interviewsResult = await this.app.service('interview')
      .find({
        query: { // TODO additional query params, e.g. filter by updatedAt for recent changes
          $limit: this.app.get('paginate').max,
          campaign: campaign._id.toString()
        }
      });
    const logs = [];
    const campaignFullName = `${study.name}/${interviewDesign.name}/${campaign.name}`;
    const interviews = interviewsResult.data;
    if (interviews.length > 0) {
      const participantsResult = await this.app.service('participant')
        .find({
          query: { // TODO additional query params, e.g. filter by updatedAt for recent changes
            $limit: this.app.get('paginate').max,
            campaign: campaign._id.toString(),
            _id: { $in: interviews.map(itw => itw.participant.toString()) }
          }
        });
      const participantIds = participantsResult.data.map(p => p._id.toString());
      const participantIdsValid = participantsResult.data
        .filter(p => p.activated && this.isParticipantInValidRange(p))
        .map(p => p._id.toString());
      const participantIdsNotValid = participantsResult.data
        .filter(p => !p.activated || !this.isParticipantInValidRange(p))
        .map(p => p._id.toString());

      const attachments = [];
      // interviews in progress that could be completed
      const itwInProgress = interviews
        .filter((itw) => itw.state === 'in_progress')
        .filter((itw) => participantIdsValid.includes(itw.participant.toString()));
      if (itwInProgress.length > 0) {
        const csvInProgress = this.toInterviewsCSV(itwInProgress);
        attachments.push({
          filename: `interviews_in_progress${this.getExtension()}`,
          contentType: 'text/plain',
          content: csvInProgress
        });
        logs.push({
          level: 'info',
          message: `Found ${itwInProgress.length} interviews in progress for campaign: ${campaignFullName}`,
          timestamp: Date.now()
        });
      } else {
        logs.push({
          level: 'info',
          message: `No interviews in progress for campaign: ${campaignFullName}`,
          timestamp: Date.now()
        });
      }
      // interviews in progress that cannot be completed
      const itwIncomplete = interviews
        .filter((itw) => itw.state === 'in_progress')
        .filter((itw) => participantIdsNotValid.includes(itw.participant.toString()) || !participantIds.includes(itw.participant.toString()));
      if (itwIncomplete.length > 0) {
        const csvIncomplete = this.toInterviewsCSV(itwIncomplete);
        attachments.push({
          filename: `interviews_incomplete${this.getExtension()}`,
          contentType: 'text/plain',
          content: csvIncomplete
        });
        logs.push({
          level: 'info',
          message: `Found ${itwIncomplete.length} interviews incomplete for campaign: ${campaignFullName}`,
          timestamp: Date.now()
        });
      } else {
        logs.push({
          level: 'info',
          message: `No interviews incomplete for campaign: ${campaignFullName}`,
          timestamp: Date.now()
        });
      }
      // completed interviews
      const itwCompleted = interviews.filter((itw) => itw.state === 'completed');
      if (itwCompleted.length > 0) {
        const csvCompleted = this.toInterviewsCSV(itwCompleted);
        attachments.push({
          filename: `interviews_completed${this.getExtension()}`,
          contentType: 'text/plain',
          content: csvCompleted
        });
        logs.push({
          level: 'info',
          message: `Found ${itwCompleted.length} interviews completed for campaign: ${campaignFullName}`,
          timestamp: Date.now()
        });
      } else {
        logs.push({
          level: 'info',
          message: `No interviews completed for campaign: ${campaignFullName}`,
          timestamp: Date.now()
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
          incomplete: itwIncomplete.length,
          completed: itwCompleted.length,
          attachments: attachments
        };
        builder.sendEmail('summaryParticipants', user, context);
      }
    } else {
      logs.push({
        level: 'info',
        message: `No interviews found for campaign: ${campaignFullName}`,
        timestamp: Date.now()
      });
    }
    return logs;
  }

  // eslint-disable-next-line no-unused-vars
  async findActiveInterviewDesigns(task) {
    const args = task.arguments || {};
    const itwdResult = await this.app.service('interview-design')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          state: 'active',
          ...args.interviewDesign
        }
      });
    return itwdResult.data;
  }

  async findValidCampaigns(task, interviewDesign) {
    const args = task.arguments || {};
    const campaignsResult = await this.app.service('campaign')
      .find({
        query: {
          $limit: this.app.get('paginate').max,
          interviewDesign: interviewDesign._id.toString(),
          ...args.campaign
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
    // exclude the reminder that participant is about to be initialized
    const reminders = participant.reminders === undefined ? [] : participant.reminders.filter((r) => r.type !== 'participants-info-activate');
    if (reminders.length === 0) {
      // never been reminded
      return now.getTime() > participant.initAt.getTime() + delayMillis;
    } else if (reminders.find((r) => r.type === 'participants-info-expire') === undefined) {
      // no expiration reminder must have been sent
      const lastRemind = participant.reminders[participant.reminders.length - 1];
      return now.getTime() > lastRemind.date.getTime() + delayMillis;
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
    const csv = new Parser({ fields: headerRows.header, delimiter: this.getDelimiter() }).parse(headerRows.rows);
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
      const csv = new Parser({ fields: headerRows.header, delimiter: this.getDelimiter() }).parse(interviews);
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
  isParticipantInValidRange(participant) {
    const now = new Date().getTime();
    return (!participant.validFrom || participant.validFrom === null || participant.validFrom.getTime() < now)
      && (!participant.validUntil || participant.validUntil === null || participant.validUntil.getTime() > now);
  }

  /**
   * Get the CSV delimiter.
   */
  getDelimiter() {
    return this.app.get('tasks').delimiter;
  }

  /**
   * Get the CSV file extension.
   */
  getExtension() {
    return this.app.get('tasks').extension;
  }
};
