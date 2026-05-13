interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * PVGIS MCP — EU Joint Research Centre PV system modeler
 *
 * API: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en
 * Direct base: https://re.jrc.ec.europa.eu/api/v5_3/
 *
 * Auth: none.
 */


const BASE = 'https://re.jrc.ec.europa.eu/api/v5_3';

const tools: McpToolExport['tools'] = [
  {
    name: 'pv_performance',
    description:
      'Model annual + monthly PV system output. Returns kWh/year estimates and monthly breakdowns.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude in degrees' },
        longitude: { type: 'number', description: 'Longitude in degrees' },
        peakpower: { type: 'number', description: 'Nominal peak power (kWp). Default 1.' },
        loss: { type: 'number', description: 'System losses (%) — default 14' },
        mountingplace: {
          type: 'string',
          description: 'free | building (BIPV). Default free.',
        },
        angle: { type: 'number', description: 'Tilt angle in degrees from horizontal. Default 35.' },
        aspect: { type: 'number', description: 'Azimuth: 0=south, 90=west, -90=east, 180=north. Default 0.' },
        pvtechchoice: {
          type: 'string',
          description: 'crystSi | CIS | CdTe | Unknown. Default crystSi.',
        },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'monthly_radiation',
    description: 'Long-term monthly average global / diffuse / direct irradiation on horizontal / inclined plane.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        horirrad: { type: 'boolean', description: 'Include horizontal irradiation (default true)' },
        optrad: { type: 'boolean', description: 'Include optimum-angle irradiation (default true)' },
        startyear: { type: 'number', description: 'Earliest year, defaults to climate database start' },
        endyear: { type: 'number', description: 'Latest year' },
        angle: { type: 'number', description: 'Specific tilt angle (default optimum)' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'tmy',
    description: 'Typical Meteorological Year — hourly synthetic year representative of the climate.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        startyear: { type: 'number' },
        endyear: { type: 'number' },
      },
      required: ['latitude', 'longitude'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'pv_performance':
      return pvPerformance(args);
    case 'monthly_radiation':
      return monthlyRadiation(args);
    case 'tmy':
      return tmy(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function pvPerformance(args: Record<string, unknown>) {
  const params = new URLSearchParams({
    lat: String(reqNum(args, 'latitude', '52.5')),
    lon: String(reqNum(args, 'longitude', '13.4')),
    peakpower: String((args.peakpower as number) ?? 1),
    loss: String((args.loss as number) ?? 14),
    mountingplace: String(args.mountingplace ?? 'free'),
    angle: String((args.angle as number) ?? 35),
    aspect: String((args.aspect as number) ?? 0),
    pvtechchoice: String(args.pvtechchoice ?? 'crystSi'),
    outputformat: 'json',
  });
  return pvgisGet(`/PVcalc?${params}`);
}

async function monthlyRadiation(args: Record<string, unknown>) {
  const params = new URLSearchParams({
    lat: String(reqNum(args, 'latitude', '52.5')),
    lon: String(reqNum(args, 'longitude', '13.4')),
    horirrad: args.horirrad === false ? '0' : '1',
    optrad: args.optrad === false ? '0' : '1',
    outputformat: 'json',
  });
  if (args.startyear !== undefined) params.set('startyear', String(args.startyear));
  if (args.endyear !== undefined) params.set('endyear', String(args.endyear));
  if (args.angle !== undefined) params.set('angle', String(args.angle));
  return pvgisGet(`/MRcalc?${params}`);
}

async function tmy(args: Record<string, unknown>) {
  const params = new URLSearchParams({
    lat: String(reqNum(args, 'latitude', '52.5')),
    lon: String(reqNum(args, 'longitude', '13.4')),
    outputformat: 'json',
  });
  if (args.startyear !== undefined) params.set('startyear', String(args.startyear));
  if (args.endyear !== undefined) params.set('endyear', String(args.endyear));
  return pvgisGet(`/tmy?${params}`);
}

async function pvgisGet(path: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PVGIS error: ${res.status} ${t.slice(0, 300)}`);
  }
  return res.json();
}

function reqNum(args: Record<string, unknown>, key: string, example: string): number {
  const v = args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`Required argument "${key}" must be a number. Example: ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
