function isParticipantValid(participant) {
  try {
    const now = new Date().getTime();
    if (!participant.activated
      || (participant.validFrom && now < participant.validFrom.getTime())
      || (participant.validUntil && now > participant.validUntil.getTime())) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function isCampaignValid(campaign) {
  try {
    const now = new Date().getTime();
    if ((campaign.validFrom && now < campaign.validFrom.getTime())
      || (campaign.validUntil && now > campaign.validUntil.getTime())) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { isParticipantValid, isCampaignValid };