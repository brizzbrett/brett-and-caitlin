// Build-time overrides. RSVP_ENDPOINT lets tools/test-rsvp.mjs point the form at a stand-in backend.
export default {
  rsvpEndpoint: process.env.RSVP_ENDPOINT || null,
};
