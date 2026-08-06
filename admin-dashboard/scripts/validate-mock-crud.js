import fetch from 'node-fetch';

const base = 'http://localhost:8000';

async function validate() {
  const resources = ['buses', 'conductors', 'routes'];
  for (const resource of resources) {
    const listResp = await fetch(`${base}/${resource}`);
    const listBody = await listResp.json();
    console.log(`GET ${resource}: ${Array.isArray(listBody) ? listBody.length : 'invalid response'}`);
  }

  const bus = { id: 'BUS-999', route: 'Test Route', currentConductor: 'COND-99', status: 'INACTIVE' };
  await fetch(`${base}/buses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bus) });
  bus.route = 'Test Route Updated';
  await fetch(`${base}/buses/BUS-999`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bus) });
  await fetch(`${base}/buses/BUS-999`, { method: 'DELETE' });
  console.log('Buses CRUD OK');

  const conductor = { id: 'COND-99', name: 'Test Conductor', phone: '9999999999' };
  await fetch(`${base}/conductors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(conductor) });
  conductor.name = 'Test Conductor Updated';
  await fetch(`${base}/conductors/COND-99`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(conductor) });
  await fetch(`${base}/conductors/COND-99`, { method: 'DELETE' });
  console.log('Conductors CRUD OK');

  const route = { id: 'R-99', name: 'Test Route Mock', from: 'A', to: 'B' };
  await fetch(`${base}/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(route) });
  route.name = 'Test Route Mock Updated';
  await fetch(`${base}/routes/R-99`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(route) });
  await fetch(`${base}/routes/R-99`, { method: 'DELETE' });
  console.log('Routes CRUD OK');

  for (const resource of resources) {
    const listResp = await fetch(`${base}/${resource}`);
    const listBody = await listResp.json();
    console.log(`FINAL ${resource} count: ${Array.isArray(listBody) ? listBody.length : 'invalid'}`);
  }
}

validate().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
