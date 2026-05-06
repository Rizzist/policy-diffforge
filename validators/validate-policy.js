const fs = require("fs");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "..", "..");
const policyRootName = path.basename(path.resolve(__dirname, ".."));
const policyRoot = path.join(workspaceRoot, policyRootName);

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`Policy validation failed: ${message}`);
}

function readJson(relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);

  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(workspaceRoot, relativePath));
}

function validateRefs(ownerPath, refs) {
  if (!Array.isArray(refs)) {
    return;
  }

  refs.forEach((ref) => {
    if (typeof ref !== "string") {
      fail(`${ownerPath} contains a non-string reference`);
      return;
    }

    if (!exists(ref)) {
      fail(`${ownerPath} references missing file ${ref}`);
    }
  });
}

function validateNodeFile(relativePath) {
  const node = readJson(relativePath);

  if (!node) {
    return;
  }

  if (!node.id && !node.schema_version) {
    fail(`${relativePath} must include id or schema_version`);
  }

  if (!node.summary && !node.project && !node.workspace) {
    fail(`${relativePath} should include summary, project, or workspace`);
  }
}

function validateDatabaseNode(relativePath) {
  const node = readJson(relativePath);

  if (!node) {
    return;
  }

  validateNodeFile(relativePath);

  if (node.kind !== "database") {
    fail(`${relativePath} must use kind database`);
  }

  if (!node.id || !node.id.startsWith("db.")) {
    fail(`${relativePath} database id must start with db.`);
  }

  if (!node.database || typeof node.database !== "object") {
    fail(`${relativePath} must include database metadata`);
    return;
  }

  ["id", "name", "engine", "default_schema"].forEach((key) => {
    if (!node.database[key]) {
      fail(`${relativePath} database metadata must include ${key}`);
    }
  });

  if (node.database.id !== node.id) {
    fail(`${relativePath} database.id must match the node id`);
  }

  if (!Array.isArray(node.schemas) || node.schemas.length === 0) {
    fail(`${relativePath} must define at least one schema`);
  }

  if (!Array.isArray(node.tables)) {
    fail(`${relativePath} must include a tables array, even when empty`);
  }
}

function validateTableNode(relativePath) {
  const node = readJson(relativePath);

  if (!node) {
    return;
  }

  validateNodeFile(relativePath);

  if (node.kind !== "table") {
    fail(`${relativePath} must use kind table`);
  }

  if (!node.id || !node.id.startsWith("table.")) {
    fail(`${relativePath} table id must start with table.`);
  }

  if (!node.database || !node.database.schema || !node.database.table) {
    fail(`${relativePath} must include database schema and table metadata`);
  }

  if (!node.columns || typeof node.columns !== "object") {
    fail(`${relativePath} must include columns metadata`);
    return;
  }

  Object.entries(node.columns).forEach(([columnName, column]) => {
    if (!column.id || !column.id.startsWith(`column.${node.database.schema}.${node.database.table}.`)) {
      fail(`${relativePath} column ${columnName} must have a stable column id`);
    }

    if (column.name !== columnName) {
      fail(`${relativePath} column ${columnName} name must match its key`);
    }
  });

  (node.indexes || []).forEach((index) => {
    (index.columns || []).forEach((columnName) => {
      if (!node.columns[columnName]) {
        fail(`${relativePath} index ${index.name || index.id} references missing column ${columnName}`);
      }
    });
  });

  (node.constraints || []).forEach((constraint) => {
    (constraint.columns || []).forEach((columnName) => {
      if (!node.columns[columnName]) {
        fail(`${relativePath} constraint ${constraint.name || constraint.id} references missing column ${columnName}`);
      }
    });
  });

  (node.foreign_keys || []).forEach((foreignKey) => {
    (foreignKey.columns || []).forEach((columnName) => {
      if (!node.columns[columnName]) {
        fail(`${relativePath} foreign key ${foreignKey.name || foreignKey.id} references missing column ${columnName}`);
      }
    });
  });
}

function collectSqlNodeIds(sqlGraph) {
  const ids = new Set();

  [
    ...(sqlGraph.databases || []),
    ...(sqlGraph.database_tables || []),
    ...(sqlGraph.migrations || [])
  ].forEach((relativePath) => {
    const node = readJson(relativePath);

    if (node && node.id) {
      ids.add(node.id);
    }
  });

  return ids;
}

function validateSqlGraph(sqlGraphPath) {
  if (!exists(sqlGraphPath)) {
    fail(`Configured SQL graph does not exist: ${sqlGraphPath}`);
    return;
  }

  const sqlGraph = readJson(sqlGraphPath);

  if (!sqlGraph) {
    return;
  }

  [
    "databases",
    "database_tables",
    "migrations"
  ].forEach((key) => validateRefs(sqlGraphPath, sqlGraph[key]));

  (sqlGraph.databases || []).forEach(validateDatabaseNode);
  (sqlGraph.database_tables || []).forEach(validateTableNode);
  (sqlGraph.migrations || []).forEach(validateNodeFile);

  const sqlNodeIds = collectSqlNodeIds(sqlGraph);

  (sqlGraph.edges || []).forEach((edge) => {
    if (!edge.id || !edge.from || !edge.to || !edge.type) {
      fail(`${sqlGraphPath} contains an edge missing id, from, to, or type`);
      return;
    }

    if (!sqlNodeIds.has(edge.from)) {
      fail(`${sqlGraphPath} edge ${edge.id} references missing from node ${edge.from}`);
    }

    if (!sqlNodeIds.has(edge.to)) {
      fail(`${sqlGraphPath} edge ${edge.id} references missing to node ${edge.to}`);
    }
  });
}

function validateProjectGraph(project) {
  if (!project.id || !project.path || !project.graph) {
    fail("Each configured project must include id, path, and graph");
    return;
  }

  if (!exists(project.path)) {
    fail(`Configured project path does not exist: ${project.path}`);
  }

  if (!exists(project.graph)) {
    fail(`Configured project graph does not exist: ${project.graph}`);
    return;
  }

  const graph = readJson(project.graph);

  if (!graph) {
    return;
  }

  [
    "files",
    "flows",
    "routes",
    "rules",
    "tests",
    "databases",
    "database_tables",
    "migrations",
    "contracts"
  ].forEach((key) => validateRefs(project.graph, graph[key]));

  [
    ...(graph.files || []),
    ...(graph.flows || []),
    ...(graph.routes || []),
    ...(graph.rules || []),
    ...(graph.tests || []),
    ...(graph.migrations || []),
    ...(graph.contracts || [])
  ].forEach(validateNodeFile);

  (graph.databases || []).forEach(validateDatabaseNode);
  (graph.database_tables || []).forEach(validateTableNode);

  if (graph.sql_graph && !exists(graph.sql_graph)) {
    fail(`${project.graph} references missing SQL graph ${graph.sql_graph}`);
  }
}

function main() {
  if (!fs.existsSync(policyRoot)) {
    fail(`${policyRootName} directory is missing`);
    return;
  }

  const config = readJson(`${policyRootName}/policy.config.json`);

  if (!config) {
    return;
  }

  const workspaceGraph = readJson(config.workspace_graph);

  if (!workspaceGraph) {
    return;
  }

  if (config.canonical_source !== "json") {
    fail("policy.config.json canonical_source must be json");
  }

  validateRefs(config.workspace_graph, workspaceGraph.rules);
  validateRefs(config.workspace_graph, workspaceGraph.docs);

  const sqlGraphPath = config.sql_graph_path || (workspaceGraph.sql && workspaceGraph.sql.graph);

  if (sqlGraphPath) {
    validateSqlGraph(sqlGraphPath);
  }

  if (!Array.isArray(config.projects) || config.projects.length === 0) {
    fail("policy.config.json must define at least one project");
  } else {
    config.projects.forEach(validateProjectGraph);
  }

  if (failures > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("Policy validation passed.");
}

main();
