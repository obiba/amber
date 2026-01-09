const { MailBuilder } = require('../utils/mail');
const logger = require('../logger');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // deactivate associated participant when its interview is completed
    if (context.result.state === 'completed') {
      context.app.service('participant').patch(context.result.participant, {
        activated: false
      });
      // get campaign administrators and send email notification about this participant's interview completion
      const campaign = await context.app.service('campaign').get(context.result.campaign);
      if (!campaign || !campaign.notifyOnInterviewCompletion) {
        return context;
      }
      const study = await context.app.service('study').get(campaign.study);
      const interviewDesign = await context.app.service('interview-design').get(context.result.interviewDesign);
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
            participant_code: context.result.code,
          };
          builder.sendEmail('interviewCompleted', user, ctx);
        } catch (err) {
          logger.error(`Error sending info participant has completed interview email to investigator ${investigator}: ${err.message}`);
        }
      }
    }
    return context;
  };
};
