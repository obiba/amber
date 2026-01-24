const nodemailer = require('nodemailer');
const { BadRequest } = require('@feathersjs/errors');

/**
 * Email service class using nodemailer directly.
 * Replaces feathers-mailer to eliminate vulnerable dependencies.
 */
class EmailService {
  constructor(transportConfig) {
    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async find() {
    throw new BadRequest('Method not allowed');
  }

  async get() {
    throw new BadRequest('Method not allowed');
  }

  /**
   * Send an email
   * @param {Object} data - Email data (from, to, subject, html, text, etc.)
   * @returns {Promise<Object>} - Send result
   */
  async create(data) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.create(item)));
    }
    return this.transporter.sendMail(data);
  }

  async update() {
    throw new BadRequest('Method not allowed');
  }

  async patch() {
    throw new BadRequest('Method not allowed');
  }

  async remove() {
    throw new BadRequest('Method not allowed');
  }
}

module.exports = { EmailService };
