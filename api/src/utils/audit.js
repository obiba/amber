/**
 * Who makes the audited request: a user, a participant or an api key, with a name that is kept
 * when the user or the participant is deleted.
 */
const accessorOf = (params) => {
  if (params.user) {
    return { accessedBy: params.user._id, accessedByType: 'user', accessedByName: params.user.email };
  }
  if (params.participant) {
    return { accessedBy: params.participant._id, accessedByType: 'participant', accessedByName: params.participant.code };
  }
  if (params.dataApiKey) {
    return { apiKey: { _id: params.dataApiKey._id, name: params.dataApiKey.name } };
  }
  return {};
};

module.exports = { accessorOf };
