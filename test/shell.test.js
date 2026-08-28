const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderEmailShell } = require("../dist/shell.js");

const BASIS = { appName: "GoodApp", title: "Titel", body: "<p>body</p>", footerText: "voet" };

// RELEASE.md doet één harde belofte over deze functie: haar uitvoer is
// byte-voor-byte geverifieerd tegen de layoutfuncties die ze verving. Er stond
// geen enkele test naast om dat vast te houden.
//
// Toegevoegd bij FOS-73, toen er een breedte-optie bij kwam. Precies dan is die
// belofte breekbaar: één verkeerd geplaatste standaard en elke klantmail van
// Veynoris, BeleggersApp en Brickstory verandert van vorm, zonder dat iets
// faalt en zonder dat iemand het ziet tot een klant het opmerkt.

test("zonder breedte blijft de kaart 560 pixels", () => {
  assert.match(renderEmailShell(BASIS), /<table width="560"/);
});

test("een opgegeven breedte verandert alléén dat ene getal", () => {
  const standaard = renderEmailShell(BASIS);
  const breed = renderEmailShell({ ...BASIS, breedte: 1100 });
  assert.match(breed, /<table width="1100"/);
  // De sterkste vorm van deze toets: vervang in de standaarduitvoer het getal
  // en de twee moeten dan identiek zijn. Verandert er iets anders mee — een
  // padding, een marge — dan valt hij hier om.
  assert.equal(standaard.replace('width="560"', 'width="1100"'), breed);
});

test("de buitenste tabel blijft op 100% staan", () => {
  // Die eerste tabel is de achtergrond en moet de hele mail vullen; alleen de
  // binnenste kaart heeft een vaste breedte. Ze verwisselen geeft een kaart die
  // meeschaalt en een achtergrond die dat niet doet.
  const html = renderEmailShell({ ...BASIS, breedte: 1100 });
  assert.match(html, /<table width="100%"/);
});

test("headerColor blijft onafhankelijk van de breedte werken", () => {
  const html = renderEmailShell({ ...BASIS, breedte: 900, headerColor: "#111111" });
  assert.match(html, /background:#111111/);
  assert.match(html, /<table width="900"/);
});

test("de standaarduitvoer is onveranderd sinds de extractie", () => {
  // De drie toetsen hierboven vergelijken twee aanroepen met elkáár. Dat vangt
  // een verkeerde breedte, maar niet een wijziging die béíde raakt: ik heb dat
  // nagegaan door de padding van de kop te veranderen, en ze bleven alle drie
  // groen.
  //
  // Dit is de toets die dat wél vangt. Het bestand ernaast is de uitvoer zoals
  // die was op het moment dat de breedte-optie erbij kwam, en dat is dezelfde
  // HTML die ooit byte-voor-byte tegen Veynoris' originelen is gelegd.
  //
  // Wordt hij rood en is de wijziging bedoeld, dan hoort het snapshot mee te
  // veranderen in dezelfde commit — met in de commitboodschap waarom elke
  // klantmail van drie producten er anders uit gaat zien.
  const verwacht = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "shell-560.snapshot.html"), "utf8");
  assert.equal(renderEmailShell(BASIS), verwacht);
});
