import type { Column, DataContract, DataProduct, LogicalType, PipelineRun, QualityRule, SlaProperty, TemplateInfo, Vocabulary } from "@/lib/types";

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "source-aligned-dbt",
    name: "Source-aligned",
    productType: "source-aligned",
    engine: "dbt on Trino",
    language: "sql",
    summary: "Cleans one raw source table and exposes it as an output port. Takes no input ports.",
    takesInputPorts: false,
  },
  {
    id: "aggregate-dbt",
    name: "Aggregate",
    productType: "aggregate",
    engine: "dbt on Trino",
    language: "sql",
    summary: "Combines output ports of other products into a new output port with SQL.",
    takesInputPorts: true,
  },
  {
    id: "spark-iceberg",
    name: "Spark job",
    productType: "aggregate",
    engine: "PySpark on Iceberg",
    language: "python",
    summary: "A PySpark job for heavier processing, reading input ports and writing an Iceberg table.",
    takesInputPorts: true,
  },
];

export const VOCABULARY: Vocabulary = {
  domains: [
    { id: "settlement", name: "Settlement", team: "Post-Trade Settlement" },
    { id: "reference-data", name: "Reference Data", team: "Reference Data" },
    { id: "risk", name: "Risk", team: "Counterparty Risk" },
  ],
  terms: [
    { id: "Settlement.SettlementInstruction", glossary: "Settlement", name: "Settlement Instruction", definition: "An order to deliver or receive securities against or free of payment." },
    { id: "Settlement.TradeDate", glossary: "Settlement", name: "Trade Date", definition: "The date on which the trade was agreed." },
    { id: "Settlement.SettlementDate", glossary: "Settlement", name: "Settlement Date", definition: "The date on which securities and cash are intended to change hands." },
    { id: "Settlement.Counterparty", glossary: "Settlement", name: "Counterparty", definition: "The legal entity on the other side of a settlement instruction." },
    { id: "Settlement.SettlementAmount", glossary: "Settlement", name: "Settlement Amount", definition: "The cash amount to be paid on settlement, in the settlement currency." },
    { id: "Settlement.SettlementStatus", glossary: "Settlement", name: "Settlement Status", definition: "Where an instruction stands: pending, matched, settled or failed." },
    { id: "Settlement.SettlementFail", glossary: "Settlement", name: "Settlement Fail", definition: "An instruction that did not settle on its intended settlement date." },
    { id: "Settlement.FailedAmount", glossary: "Settlement", name: "Failed Amount", definition: "The total settlement amount of failed instructions." },
    { id: "Settlement.FailRate", glossary: "Settlement", name: "Fail Rate", definition: "Failed instructions as a share of all instructions due on a date." },
    { id: "Settlement.AccountContact", glossary: "Settlement", name: "Account Contact", definition: "The person to contact about a securities account." },
    { id: "Reference.ISIN", glossary: "Reference", name: "ISIN", definition: "International Securities Identification Number, the twelve-character identifier of a security." },
    { id: "Reference.SecurityName", glossary: "Reference", name: "Security Name", definition: "The issuer's name for the security." },
    { id: "Reference.AssetClass", glossary: "Reference", name: "Asset Class", definition: "The category of a security, such as equity, bond or fund." },
    { id: "Reference.Currency", glossary: "Reference", name: "Currency", definition: "ISO 4217 currency code." },
    { id: "Reference.LEI", glossary: "Reference", name: "Legal Entity Identifier", definition: "The twenty-character ISO 17442 identifier of a legal entity." },
    { id: "Risk.Exposure", glossary: "Risk", name: "Exposure", definition: "The amount at risk towards a counterparty at a point in time." },
    { id: "Risk.ObservationDate", glossary: "Risk", name: "Observation Date", definition: "The date a risk figure refers to." },
    { id: "Reference.LastUpdated", glossary: "Reference", name: "Last Updated", definition: "When a reference record last changed at its source." },
  ],
  classifications: [
    { fqn: "Confidentiality.Public", group: "Confidentiality", name: "Public", description: "May be shared outside the organisation." },
    { fqn: "Confidentiality.Internal", group: "Confidentiality", name: "Internal", description: "For employees and contractors." },
    { fqn: "Confidentiality.Confidential", group: "Confidentiality", name: "Confidential", description: "Need-to-know; commercially sensitive." },
    { fqn: "Confidentiality.Restricted", group: "Confidentiality", name: "Restricted", description: "Named individuals only." },
  ],
  tags: [
    { fqn: "PII.Sensitive", group: "PII", name: "Sensitive", description: "Identifies a natural person." },
    { fqn: "PII.NonSensitive", group: "PII", name: "NonSensitive", description: "Personal data that does not identify a person on its own." },
    { fqn: "Tier.Tier1", group: "Tier", name: "Tier1", description: "Business-critical." },
    { fqn: "Tier.Tier2", group: "Tier", name: "Tier2", description: "Important, not critical." },
    { fqn: "Tier.Tier3", group: "Tier", name: "Tier3", description: "Departmental." },
    { fqn: "Regulatory.CSDR", group: "Regulatory", name: "CSDR", description: "Used for settlement-discipline reporting." },
    { fqn: "Regulatory.BCBS239", group: "Regulatory", name: "BCBS239", description: "In scope of risk data aggregation principles." },
  ],
};

/* ---------- builders ---------- */

let ruleSeq = 0;
const rule = (name: string, partial: Partial<QualityRule> & Pick<QualityRule, "operator" | "value">): QualityRule => ({
  id: `r${++ruleSeq}`,
  name,
  type: "library",
  metric: "nullValues",
  dimension: "completeness",
  severity: "error",
  ...partial,
});

type ColumnOptions = Partial<Omit<Column, "id" | "name" | "logicalType" | "description">>;
const col = (contractId: string, name: string, logicalType: LogicalType, description: string, options: ColumnOptions = {}): Column => ({
  id: `${contractId}:${name}`,
  name,
  logicalType,
  description,
  required: false,
  unique: false,
  primaryKey: false,
  tags: [],
  quality: [],
  ...options,
});

let slaSeq = 0;
const sla = (property: SlaProperty["property"], value: number, unit: string, element?: string): SlaProperty => ({ id: `s${++slaSeq}`, property, value, unit, element });

const INTERNAL = "Confidentiality.Internal";
const PUBLIC = "Confidentiality.Public";
const CONFIDENTIAL = "Confidentiality.Confidential";
const RESTRICTED = "Confidentiality.Restricted";

export function seedContracts(): DataContract[] {
  ruleSeq = 0;
  slaSeq = 0;
  const securities = "reference-data.securities-master.securities";
  const instructions = "settlement.settlement-instructions.instructions";
  const fails = "settlement.settlement-fails-daily.fails_daily";
  const exposure = "risk.counterparty-exposure.exposure";
  const legacy = "settlement.legacy-fails-report.fails_report";

  return [
    {
      id: securities,
      productId: "reference-data.securities-master",
      port: "securities",
      name: "Securities master",
      version: "1.2.0",
      status: "active",
      purpose: "One row per security, with the identifiers and static attributes every other product joins on.",
      table: "securities",
      tableDescription: "Current view of all securities eligible for settlement.",
      columns: [
        col(securities, "isin", "string", "International Securities Identification Number.", {
          required: true, unique: true, primaryKey: true, classification: PUBLIC, businessTerm: "Reference.ISIN", tags: ["Tier.Tier1"],
          quality: [rule("ISIN is unique", { metric: "duplicateValues", operator: "mustBe", value: 0, dimension: "uniqueness" })],
        }),
        col(securities, "security_name", "string", "Name of the security as given by the issuer.", { required: true, classification: PUBLIC, businessTerm: "Reference.SecurityName" }),
        col(securities, "asset_class", "string", "Equity, bond, fund or other.", { required: true, classification: PUBLIC, businessTerm: "Reference.AssetClass" }),
        col(securities, "currency", "string", "Currency the security is denominated in.", { required: true, classification: PUBLIC, businessTerm: "Reference.Currency" }),
        col(securities, "issuer_lei", "string", "Legal entity identifier of the issuer.", { classification: PUBLIC, businessTerm: "Reference.LEI" }),
        col(securities, "updated_at", "timestamp", "When the record last changed at the source.", { required: true, classification: INTERNAL, businessTerm: "Reference.LastUpdated" }),
      ],
      quality: [rule("Table is not empty", { metric: "rowCount", operator: "mustBeGreaterThan", value: 0, dimension: "completeness" })],
      sla: [sla("frequency", 1, "d"), sla("latency", 24, "h", "securities.updated_at")],
      tags: ["Tier.Tier1"],
      updatedAt: "2026-10-02T08:10:00Z",
    },
    {
      id: instructions,
      productId: "settlement.settlement-instructions",
      port: "instructions",
      name: "Settlement instructions",
      version: "2.0.1",
      status: "active",
      purpose: "Cleaned settlement instructions as received from the settlement engine, one row per instruction.",
      table: "instructions",
      tableDescription: "All settlement instructions of the last 400 days with their current status.",
      columns: [
        col(instructions, "instruction_id", "string", "Identifier assigned by the settlement engine.", {
          required: true, unique: true, primaryKey: true, classification: INTERNAL, businessTerm: "Settlement.SettlementInstruction",
          quality: [rule("Instruction id is unique", { metric: "duplicateValues", operator: "mustBe", value: 0, dimension: "uniqueness" })],
        }),
        col(instructions, "isin", "string", "Security being settled.", { required: true, classification: PUBLIC, businessTerm: "Reference.ISIN" }),
        col(instructions, "trade_date", "date", "Date the trade was agreed.", { required: true, classification: INTERNAL, businessTerm: "Settlement.TradeDate" }),
        col(instructions, "settlement_date", "date", "Intended settlement date.", { required: true, classification: INTERNAL, businessTerm: "Settlement.SettlementDate" }),
        col(instructions, "counterparty_lei", "string", "Legal entity identifier of the counterparty.", {
          required: true, classification: CONFIDENTIAL, businessTerm: "Settlement.Counterparty",
          quality: [rule("Counterparty is always present", { metric: "nullValues", operator: "mustBe", value: 0 })],
        }),
        col(instructions, "account_contact_email", "string", "E-mail address of the account's operational contact.", {
          classification: RESTRICTED, businessTerm: "Settlement.AccountContact", tags: ["PII.Sensitive"],
          quality: [rule("Contact e-mail is mostly filled", { metric: "missingValues", operator: "mustBeLessThan", value: 2, unit: "percent", severity: "warning" })],
        }),
        col(instructions, "settlement_amount", "number", "Cash amount due on settlement.", { required: true, classification: CONFIDENTIAL, businessTerm: "Settlement.SettlementAmount" }),
        col(instructions, "currency", "string", "Settlement currency.", { required: true, classification: PUBLIC, businessTerm: "Reference.Currency" }),
        col(instructions, "status", "string", "pending, matched, settled or failed.", { required: true, classification: INTERNAL, businessTerm: "Settlement.SettlementStatus" }),
      ],
      quality: [
        rule("Settlement is never before trade", {
          type: "sql", metric: undefined, query: "SELECT COUNT(*) FROM ${table} WHERE settlement_date < trade_date", operator: "mustBe", value: 0, dimension: "consistency",
        }),
      ],
      sla: [sla("frequency", 1, "d"), sla("latency", 26, "h", "instructions.settlement_date"), sla("retention", 7, "y")],
      tags: ["Tier.Tier1", "Regulatory.CSDR"],
      updatedAt: "2026-10-21T15:42:00Z",
    },
    {
      id: fails,
      productId: "settlement.settlement-fails-daily",
      port: "fails_daily",
      name: "Settlement fails daily",
      version: "1.3.0",
      status: "active",
      purpose: "Daily count and value of failed settlement instructions per counterparty and asset class.",
      table: "fails_daily",
      tableDescription: "One row per settlement date, counterparty and asset class.",
      columns: [
        col(fails, "settlement_date", "date", "Intended settlement date of the instructions counted.", { required: true, primaryKey: true, classification: INTERNAL, businessTerm: "Settlement.SettlementDate" }),
        col(fails, "counterparty_lei", "string", "Legal entity identifier of the counterparty.", { required: true, primaryKey: true, classification: INTERNAL, businessTerm: "Settlement.Counterparty" }),
        col(fails, "asset_class", "string", "Asset class of the securities.", { required: true, primaryKey: true, classification: PUBLIC, businessTerm: "Reference.AssetClass" }),
        col(fails, "failed_instructions", "integer", "Number of instructions that failed to settle.", {
          required: true, classification: INTERNAL, businessTerm: "Settlement.SettlementFail",
          quality: [rule("Fail count is never missing", { metric: "nullValues", operator: "mustBe", value: 0 })],
        }),
        col(fails, "failed_amount", "number", "Total settlement amount of the failed instructions.", { required: true, classification: CONFIDENTIAL, businessTerm: "Settlement.FailedAmount" }),
        col(fails, "fail_rate", "number", "Failed instructions divided by all instructions due.", {
          required: true, classification: INTERNAL, businessTerm: "Settlement.FailRate",
          quality: [rule("Fail rate is a share", { type: "sql", metric: undefined, query: "SELECT COUNT(*) FROM ${table} WHERE fail_rate NOT BETWEEN 0 AND 1", operator: "mustBe", value: 0, dimension: "accuracy" })],
        }),
      ],
      quality: [rule("Has rows for the latest date", { metric: "rowCount", operator: "mustBeGreaterThan", value: 0 })],
      sla: [sla("frequency", 1, "d"), sla("latency", 30, "h", "fails_daily.settlement_date")],
      tags: ["Regulatory.CSDR", "Tier.Tier2"],
      updatedAt: "2026-11-04T09:18:00Z",
    },
    {
      id: exposure,
      productId: "risk.counterparty-exposure",
      port: "exposure",
      name: "Counterparty exposure",
      version: "0.3.0",
      status: "draft",
      purpose: "Exposure towards each counterparty arising from failed settlements, with a rolling fail rate.",
      table: "exposure",
      tableDescription: "One row per observation date and counterparty.",
      columns: [
        col(exposure, "as_of_date", "date", "Date the figures refer to.", { required: true, primaryKey: true, classification: INTERNAL, businessTerm: "Risk.ObservationDate" }),
        col(exposure, "counterparty_lei", "string", "Legal entity identifier of the counterparty.", { required: true, primaryKey: true, classification: CONFIDENTIAL, businessTerm: "Settlement.Counterparty" }),
        col(exposure, "exposure_amount", "number", "Open amount towards the counterparty.", { required: true, classification: CONFIDENTIAL }),
        col(exposure, "fail_rate_30d", "number", "", { businessTerm: "Settlement.FailRate" }),
      ],
      quality: [],
      sla: [sla("frequency", 1, "d")],
      tags: ["Regulatory.BCBS239"],
      updatedAt: "2026-11-10T13:05:00Z",
    },
    {
      id: legacy,
      productId: "settlement.legacy-fails-report",
      port: "fails_report",
      name: "Legacy fails report",
      version: "1.4.2",
      status: "deprecated",
      purpose: "Monthly fails report in the layout of the former reporting system.",
      table: "fails_report",
      tableDescription: "One row per month and counterparty.",
      columns: [
        col(legacy, "report_month", "date", "First day of the reporting month.", { required: true, primaryKey: true, classification: INTERNAL, businessTerm: "Settlement.SettlementDate" }),
        col(legacy, "counterparty_lei", "string", "Legal entity identifier of the counterparty.", { required: true, primaryKey: true, classification: CONFIDENTIAL, businessTerm: "Settlement.Counterparty" }),
        col(legacy, "fails", "integer", "Number of failed instructions in the month.", {
          required: true, classification: INTERNAL, businessTerm: "Settlement.SettlementFail",
          quality: [rule("Fails is never missing", { metric: "nullValues", operator: "mustBe", value: 0 })],
        }),
      ],
      quality: [],
      sla: [sla("frequency", 30, "d"), sla("latency", 35, "d", "fails_report.report_month")],
      tags: [],
      updatedAt: "2026-06-18T10:00:00Z",
    },
  ];
}

export function seedProducts(): DataProduct[] {
  const base = { usage: undefined, limitations: undefined, tags: [] as string[] };
  return [
    {
      ...base,
      id: "reference-data.securities-master",
      name: "securities-master",
      title: "Securities Master",
      domain: "reference-data",
      purpose: "The single list of securities and their static attributes, for every product that needs to identify or classify a security.",
      status: "active",
      version: "1.2.0",
      team: "Reference Data",
      owner: "reference-data@example.org",
      template: "source-aligned-dbt",
      schedule: "0 5 * * *",
      inputPorts: [],
      outputPorts: [{ name: "securities", description: "Current securities.", contractId: "reference-data.securities-master.securities", version: "1.2.0" }],
      tags: ["Tier.Tier1"],
      transformation: {
        language: "sql",
        code: "select\n    isin,\n    trim(security_name) as security_name,\n    lower(asset_class) as asset_class,\n    currency,\n    issuer_lei,\n    updated_at\nfrom {{ source('raw', 'securities') }}\nwhere isin is not null",
      },
      createdAt: "2026-03-11T09:00:00Z",
      updatedAt: "2026-10-02T08:10:00Z",
    },
    {
      ...base,
      id: "settlement.settlement-instructions",
      name: "settlement-instructions",
      title: "Settlement Instructions",
      domain: "settlement",
      purpose: "Settlement instructions as the settlement engine holds them, cleaned and typed, for anyone analysing settlement activity.",
      limitations: "Contains personal data of account contacts. Instructions older than 400 days are not included.",
      status: "active",
      version: "2.0.1",
      team: "Post-Trade Settlement",
      owner: "settlement-data@example.org",
      template: "source-aligned-dbt",
      schedule: "30 5 * * *",
      inputPorts: [],
      outputPorts: [{ name: "instructions", description: "One row per instruction.", contractId: "settlement.settlement-instructions.instructions", version: "2.0.1" }],
      tags: ["Tier.Tier1", "Regulatory.CSDR"],
      transformation: {
        language: "sql",
        code: "select\n    instruction_id,\n    isin,\n    cast(trade_date as date) as trade_date,\n    cast(settlement_date as date) as settlement_date,\n    counterparty_lei,\n    lower(account_contact_email) as account_contact_email,\n    settlement_amount,\n    currency,\n    lower(status) as status\nfrom {{ source('raw', 'settlement_instructions') }}",
      },
      createdAt: "2026-03-18T09:00:00Z",
      updatedAt: "2026-10-21T15:42:00Z",
    },
    {
      ...base,
      id: "settlement.settlement-fails-daily",
      name: "settlement-fails-daily",
      title: "Settlement Fails Daily",
      domain: "settlement",
      purpose: "How many instructions failed to settle each day, and for how much, per counterparty and asset class.",
      usage: "Settlement-discipline monitoring and counterparty reviews.",
      status: "active",
      version: "1.3.0",
      team: "Post-Trade Settlement",
      owner: "settlement-data@example.org",
      template: "aggregate-dbt",
      schedule: "0 6 * * *",
      inputPorts: [
        { name: "instructions", contractId: "settlement.settlement-instructions.instructions", version: "2.0.1" },
        { name: "securities", contractId: "reference-data.securities-master.securities", version: "1.2.0" },
      ],
      outputPorts: [{ name: "fails_daily", description: "Daily fails per counterparty and asset class.", contractId: "settlement.settlement-fails-daily.fails_daily", version: "1.3.0" }],
      tags: ["Regulatory.CSDR", "Tier.Tier2"],
      transformation: {
        language: "sql",
        code: "select\n    i.settlement_date,\n    i.counterparty_lei,\n    s.asset_class,\n    count_if(i.status = 'failed') as failed_instructions,\n    sum(if(i.status = 'failed', i.settlement_amount, 0)) as failed_amount,\n    cast(count_if(i.status = 'failed') as double) / count(*) as fail_rate\nfrom {{ ref('instructions') }} i\njoin {{ ref('securities') }} s on s.isin = i.isin\ngroup by 1, 2, 3",
      },
      createdAt: "2026-04-22T09:00:00Z",
      updatedAt: "2026-11-04T09:18:00Z",
    },
    {
      ...base,
      id: "risk.counterparty-exposure",
      name: "counterparty-exposure",
      title: "Counterparty Exposure",
      domain: "risk",
      purpose: "Exposure towards each counterparty from failed settlements, for the daily counterparty risk review.",
      status: "draft",
      version: "0.3.0",
      team: "Counterparty Risk",
      owner: "counterparty-risk@example.org",
      template: "spark-iceberg",
      schedule: "30 6 * * *",
      inputPorts: [{ name: "fails_daily", contractId: "settlement.settlement-fails-daily.fails_daily", version: "1.3.0" }],
      outputPorts: [{ name: "exposure", description: "Exposure per counterparty and day.", contractId: "risk.counterparty-exposure.exposure", version: "0.3.0" }],
      tags: ["Regulatory.BCBS239"],
      transformation: {
        language: "python",
        code: "from pyspark.sql import functions as F, Window\n\nfails = spark.table(input_port('fails_daily'))\nwindow = Window.partitionBy('counterparty_lei').orderBy('settlement_date').rowsBetween(-29, 0)\n\nexposure = (\n    fails.groupBy('settlement_date', 'counterparty_lei')\n    .agg(F.sum('failed_amount').alias('exposure_amount'), F.avg('fail_rate').alias('fail_rate'))\n    .withColumn('fail_rate_30d', F.avg('fail_rate').over(window))\n    .select(F.col('settlement_date').alias('as_of_date'), 'counterparty_lei', 'exposure_amount', 'fail_rate_30d')\n)\n\nwrite_output_port(exposure, 'exposure')",
      },
      createdAt: "2026-10-27T09:00:00Z",
      updatedAt: "2026-11-10T13:05:00Z",
    },
    {
      ...base,
      id: "settlement.legacy-fails-report",
      name: "legacy-fails-report",
      title: "Legacy Fails Report",
      domain: "settlement",
      purpose: "The monthly fails report in the layout of the former reporting system, kept until its last consumers have moved.",
      status: "deprecated",
      version: "1.4.2",
      team: "Post-Trade Settlement",
      owner: "settlement-data@example.org",
      template: "aggregate-dbt",
      schedule: "0 7 1 * *",
      inputPorts: [{ name: "instructions", contractId: "settlement.settlement-instructions.instructions", version: "2.0.1" }],
      outputPorts: [{ name: "fails_report", description: "Monthly fails per counterparty.", contractId: "settlement.legacy-fails-report.fails_report", version: "1.4.2" }],
      transformation: {
        language: "sql",
        code: "select\n    date_trunc('month', settlement_date) as report_month,\n    counterparty_lei,\n    count_if(status = 'failed') as fails\nfrom {{ ref('instructions') }}\ngroup by 1, 2",
      },
      sunsetDate: "2027-03-31",
      successor: "settlement.settlement-fails-daily",
      createdAt: "2026-03-25T09:00:00Z",
      updatedAt: "2026-06-18T10:00:00Z",
    },
    {
      ...base,
      id: "risk.liquidity-forecast",
      name: "liquidity-forecast",
      title: "Liquidity Forecast",
      domain: "risk",
      purpose: "Expected cash need per currency for the next five settlement days, from pending instructions.",
      status: "proposed",
      version: "0.1.0",
      team: "Counterparty Risk",
      owner: "counterparty-risk@example.org",
      template: "aggregate-dbt",
      schedule: "0 6 * * *",
      inputPorts: [],
      outputPorts: [],
      transformation: { language: "sql", code: "" },
      createdAt: "2026-11-09T09:00:00Z",
      updatedAt: "2026-11-09T09:00:00Z",
    },
  ];
}

/** Rule names that the simulated latest run reports as failed. */
export const SEEDED_FAILURES = new Set(["Contact e-mail is mostly filled"]);

export function seedRuns(): PipelineRun[] {
  const done = (id: string, productId: string, kind: PipelineRun["kind"], title: string, startedAt: string): PipelineRun => ({ id, productId, kind, title, startedAt, steps: [] });
  return [
    done("run-1009", "settlement.settlement-fails-daily", "contract-change", "Add fail_rate to the contract", "2026-11-04T09:18:00Z"),
    done("run-1007", "risk.counterparty-exposure", "create", "Create Counterparty Exposure", "2026-10-27T09:00:00Z"),
    done("run-1004", "settlement.settlement-instructions", "contract-change", "Rename contact_email to account_contact_email", "2026-10-21T15:42:00Z"),
    done("run-1002", "reference-data.securities-master", "contract-change", "Add issuer_lei", "2026-10-02T08:10:00Z"),
    done("run-0991", "settlement.legacy-fails-report", "lifecycle", "Deprecate Legacy Fails Report", "2026-06-18T10:00:00Z"),
  ];
}
