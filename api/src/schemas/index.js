/**
 * Schema index - exports all Joi validation schemas
 */

const common = require('./common');
const audit = require('./audit.schema');
const campaign = require('./campaign.schema');
const caseReport = require('./case-report.schema');
const caseReportForm = require('./case-report-form.schema');
const form = require('./form.schema');
const formRevision = require('./form-revision.schema');
const group = require('./group.schema');
const interview = require('./interview.schema');
const interviewDesign = require('./interview-design.schema');
const participant = require('./participant.schema');
const study = require('./study.schema');
const task = require('./task.schema');
const user = require('./user.schema');

module.exports = {
  // Common utilities
  ...common,
  
  // Audit schemas
  ...audit,
  
  // Campaign schemas
  ...campaign,
  
  // Case Report schemas
  ...caseReport,
  
  // Case Report Form schemas
  ...caseReportForm,
  
  // Form schemas
  ...form,
  
  // Form Revision schemas
  ...formRevision,
  
  // Group schemas
  ...group,
  
  // Interview schemas
  ...interview,
  
  // Interview Design schemas
  ...interviewDesign,
  
  // Participant schemas
  ...participant,
  
  // Study schemas
  ...study,
  
  // Task schemas
  ...task,
  
  // User schemas
  ...user
};
