// PLAT-278 — bcc in sendEmail. Het Resend-clientobject is een singleton per API-sleutel, dus we
// vervangen emails.send op die ene instantie en kijken wat er werkelijk wordt doorgegeven.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { sendEmail, getResendClient } = require("../dist");

const stil = { info() {}, warn() {}, error() {} };

function vang(sleutel) {
  const r = getResendClient(sleutel);
  const calls = [];
  r.emails.send = async (payload) => { calls.push(payload); return { data: { id: "id-1" }, error: null }; };
  return calls;
}

test("zonder bcc bevat de aanroep naar Resend geen bcc-sleutel (gedrag van 0.2.0 blijft)", async () => {
  const calls = vang("re_test_zonder");
  const r = await sendEmail({ apiKey: "re_test_zonder", from: "a@x.be", to: "b@y.be", subject: "s", text: "t", logger: stil });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 1);
  assert.equal("bcc" in calls[0], false, "geen bcc-sleutel als er geen bcc is");
});

test("een bcc als tekst wordt ongewijzigd doorgegeven", async () => {
  const calls = vang("re_test_tekst");
  await sendEmail({ apiKey: "re_test_tekst", from: "a@x.be", to: "b@y.be", bcc: "kopie@z.be", subject: "s", text: "t", logger: stil });
  assert.equal(calls[0].bcc, "kopie@z.be");
  assert.equal(calls[0].to, "b@y.be", "to blijft ongemoeid; bcc wordt niet bij to gevoegd");
});

test("een bcc als lijst wordt ongewijzigd doorgegeven", async () => {
  const calls = vang("re_test_lijst");
  await sendEmail({ apiKey: "re_test_lijst", from: "a@x.be", to: ["b@y.be"], bcc: ["k1@z.be", "k2@z.be"], subject: "s", html: "<p>t</p>", logger: stil });
  assert.deepEqual(calls[0].bcc, ["k1@z.be", "k2@z.be"]);
});

test("het bcc-adres komt niet in de logregels", async () => {
  const regels = [];
  const logger = { info: (...a) => regels.push(JSON.stringify(a)), warn: (...a) => regels.push(JSON.stringify(a)), error: (...a) => regels.push(JSON.stringify(a)) };
  vang("re_test_log");
  await sendEmail({ apiKey: "re_test_log", from: "a@x.be", to: "b@y.be", bcc: "geheim-kopie@z.be", subject: "s", text: "t", logger });
  assert.ok(regels.length > 0);
  assert.ok(!regels.join("\n").includes("geheim-kopie@z.be"), "bcc mag niet in een logregel staan");
});

test("ook bij een mislukte poging blijft bcc buiten het log, en de retry stuurt hem opnieuw mee", async () => {
  const regels = [];
  const logger = { info: (...a) => regels.push(JSON.stringify(a)), warn: (...a) => regels.push(JSON.stringify(a)), error: (...a) => regels.push(JSON.stringify(a)) };
  const r = getResendClient("re_test_retry");
  const calls = [];
  r.emails.send = async (p) => { calls.push(p); return calls.length === 1 ? { data: null, error: { message: "tijdelijk" } } : { data: { id: "id-2" }, error: null }; };
  const uit = await sendEmail({ apiKey: "re_test_retry", from: "a@x.be", to: "b@y.be", bcc: "geheim-kopie@z.be", subject: "s", text: "t", maxRetries: 1, retryDelayMs: 1, logger });
  assert.equal(uit.ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].bcc, "geheim-kopie@z.be");
  assert.ok(!regels.join("\n").includes("geheim-kopie@z.be"));
});
