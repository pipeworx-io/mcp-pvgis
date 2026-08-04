# @pipeworx/pvgis

PVGIS MCP — EU JRC Photovoltaic Geographical Information System. Models PV system output for any location. No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `pv_performance(latitude, longitude, peakpower, ...)` — annual / monthly PV yield estimates
- `tmy(latitude, longitude, year_min?, year_max?)` — typical meteorological year (hourly)
- `monthly_radiation(latitude, longitude, ...)` — long-term monthly irradiation

## Data source

`https://re.jrc.ec.europa.eu/api/v5_3/` — public, no auth.

Coverage: global, but most accurate for Europe / Africa / Asia (uses PVGIS-SARAH3, PVGIS-NSRDB, PVGIS-ERA5).

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "pvgis": {
      "url": "https://gateway.pipeworx.io/pvgis/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Pvgis data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
