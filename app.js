const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running in http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API1

app.get("/states/", async (request, response) => {
  try {
    getStatesQuery = `
            SELECT
                 * 
             FROM 
                 state;`;
    const statesArray = await db.all(getStatesQuery);
    response.send(
      statesArray.map((eachState) => {
        return convertStateDbObjectToResponseObject(eachState);
      })
    );
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
});

//API2

app.get("/states/:stateId/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateQuery = `
            SELECT *
            FROM state
            WHERE state_id = ${stateId};`;

    const getStateById = await db.get(getStateQuery);
    response.send(convertStateDbObjectToResponseObject(getStateById));
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
});

//API3

app.post("/districts/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const postDistrictsQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths )
  VALUES
    ('${districtName}', '${stateId}', '${cases}', '${cured}' , '${active}', '${deaths}');`;

    const district = await db.run(postDistrictsQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
});

//API4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId}`;

  const getDistrict = await db.get(getDistrictsQuery);
  response.send(convertDistrictDbObjectToResponseObject(getDistrict));
});

//API5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId} 
  `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API6

app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;

    await db.run(updateDistrictQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
    const stats = await db.get(getStateStatsQuery);
    response.send({
      totalCases: stats["SUM(cases)"],
      totalCured: stats["SUM(cured)"],
      totalActive: stats["SUM(active)"],
      totalDeaths: stats["SUM(deaths)"],
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
});

//API8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
