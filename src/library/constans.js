export const BASE_URL = import.meta.env.VITE_API_URL;

export const INCOMING_CALL_REPORT = BASE_URL + '/incoming-call-details';
export const OUTGOING_CALL_REPORT = BASE_URL + '/outcoming-call-details';
export const OUTGOING_REPORT_EXPORT = BASE_URL + '/export/outgoing-call';
export const INCOMING_REPORT_EXPORT = BASE_URL + '/export/incoming-call';

export const GET_ALL_AGENTS_LIST = BASE_URL + '/agents/list';
export const GET_RECENT_CALLS = BASE_URL + '/recent-calls';
export const GET_FOLLOW_UP_CALLS = BASE_URL + '/followup-calls';
export const GET_CONTACT_DIRECTORY = BASE_URL + '/contact-directory';

export const GET_CALL_HISTORY = BASE_URL + '/call-history';
export const EXPORT_CALL_HISTORY_BY_ID = BASE_URL + '/call-history/download';
export const EXPORT_CALL_HISTORY_ALL = BASE_URL + '/call-history/download-all';
export const GET_FOLLOW_UP_CALL_REPORT = BASE_URL + '/followup-call-details' ;
export const UPDATE_FOLLOW_UP = BASE_URL + '/follow-up-update';