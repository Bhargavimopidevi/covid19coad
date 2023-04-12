const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const databasePath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistricttorDbObjectToResponseObject = (dbObject) => {
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
app.get("/states/", async (request, response) => {
  const getStateQueries = `
      SELECT * 
      FROM state;`;
  const stateArray = await database.all(getStateQueries);
  response.send(
    stateArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateId = `
    SELECT *
    FROM state
    WHERE state_id=${stateId};`;
  const state = await database.get(getStateId);
  response.send(convertStateDbObjectToResponseObject(state));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO *
    state(districtName,stateId,cases,cured,active,deaths)
    VALUES 
       (${districtName},'${stateId}','${cases}','${cured}','${active}','${deaths}';)`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
      *
    FROM 
      district
    WHERE 
      district_id= ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
            UPDATE
              district
            SET
              district_name = ${districtName},
              state_id= '${stateId}',
              cases = '${cases}',
              cures='${cured}',
              active='${active}',
              deaths='${deaths}'
            WHERE
              district_id = ${districtId};`;

  await database.run();
  response.send("District Details Updated");
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
      state_name
    FROM
      state
    WHERE
      district_id='${districtId}';`;
  const districtArray = await database.all(getDistrictQuery);
  response.send(
    districtArray.map((eachDistrict) => ({
      stateName: eachDistrict.state_name,
    }))
  );
});
module.exports = app;
