const { MailBuilder } = require('../utils/mail');
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // deactivate associated participant when its interview is completed
    if (context.result.state === 'completed') {
      const participant = await context.app.service('participant').patch(context.result.participant, {
        activated: false
      });
      // get campaign investigators and send email notification about this participant's interview completion
      const campaign = await context.app.service('campaign').get(participant.campaign);
      if (!campaign || !campaign.notifyOnInterviewCompletion) {
        return context;
      }
      if (!Array.isArray(campaign.investigators) || campaign.investigators.length === 0) {
        return context;
      }
      const study = await context.app.service('study').get(campaign.study);
      if (!study) {
        logger.error(`Study not found for campaign ${campaign._id} when sending interview completion notification.`);
        return context;
      }
      const interviewDesign = await context.app.service('interview-design').get(participant.interviewDesign);
      if (!interviewDesign) {
        logger.error(`Interview design not found for interview ${participant.interviewDesign} when sending interview completion notification.`);
        return context;
      }
      for (const investigator of campaign.investigators) {
        try {
          const builder = new MailBuilder(context.app);
          // recipient
          const user = await context.app.service('user').get(investigator);
          // email context
          const ctx = {
            study: study.name,
            interview: interviewDesign.name,
            campaign: campaign.name,
            study_id: study._id,
            interview_id: interviewDesign._id,
            campaign_id: campaign._id,
            code_identifier: `${participant.code}${participant.identifier ? ` (${participant.identifier})` : '' }`
          };
          builder.sendEmail('interviewCompleted', user, ctx);
        } catch (err) {
          logger.error(`Error sending interview completion notification email to investigator ${investigator}: ${err.message}`);
        }
      }
    }
    return context;
  };
};
