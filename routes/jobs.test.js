"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
	let newJob = {
		title: "new",
		salary: 20,
		equity: 0,
		company_handle: "c1",
	};

	test("ok for admins", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: {
				...newJob,
				equity: `${newJob.equity}`,
				id: expect.any(Number),
			},
		});
	});

	test("fails unauthorized", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "new",
				salary: 10,
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				...newJob,
				salary: "not-a-number",
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					company_handle: "c2",
					equity: "0",
					id: expect.any(Number),
					salary: 50000,
					title: "IT Engineer",
				},
				{
					company_handle: "c1",
					equity: "0.002",
					id: expect.any(Number),
					salary: 30000,
					title: "Janitor",
				},
				{
					company_handle: "c1",
					equity: "0",
					id: expect.any(Number),
					salary: 59000,
					title: "Software engineer",
				},
			],
		});
	});

	test("ok with one query", async function () {
		const resp = await request(app).get("/jobs?title=engineer");
		expect(resp.body).toEqual({
			jobs: [
				{
					company_handle: "c2",
					equity: "0",
					id: expect.any(Number),
					salary: 50000,
					title: "IT Engineer",
				},
				{
					company_handle: "c1",
					equity: "0",
					id: expect.any(Number),
					salary: 59000,
					title: "Software engineer",
				},
			],
		});
	});

	test("ok with two queries", async function () {
		const resp = await request(app).get("/jobs?title=doctor&minSalary=2");
		expect(resp.body).toEqual({
			jobs: [],
		});
		const resp2 = await request(app).get(
			"/jobs?title=engineer&minSalary=55000"
		);
		expect(resp2.body).toEqual({
			jobs: [
				{
					company_handle: "c1",
					equity: "0",
					id: expect.any(Number),
					salary: 59000,
					title: "Software engineer",
				},
			],
		});
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE jobs CASCADE");
		const resp = await request(app)
			.get("/jobs")
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/jobs/1`);
		expect(resp.body).toEqual({
			job: {
				id: 1,
				company_handle: "c1",
				equity: "0",
				salary: 59000,
				title: "Software engineer",
			},
		});
	});

	test("not found for no such job", async function () {
		const resp = await request(app).get(`/jobs/0`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
	test("works for admins", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: "Updated",
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.body).toEqual({
			job: {
				id: 1,
				company_handle: "c1",
				equity: "0",
				salary: 59000,
				title: "Updated",
			},
		});
	});

	test("unauth for non admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: "Updated",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such job", async function () {
		const resp = await request(app)
			.patch(`/jobs/0`)
			.send({
				title: "new nope",
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on id change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				id: 508,
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				salary: "hey",
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/1`)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.body).toEqual({
			deleted: { id: 1, title: "Software engineer" },
		});
	});

	test("unauth for non admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/1`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such job", async function () {
		const resp = await request(app)
			.delete(`/jobs/0`)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
