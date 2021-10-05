"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
	const newJob = {
		title: "new",
		salary: 20,
		equity: "0",
		company_handle: "c1",
	};

	test("works", async function () {
		let job = await Job.create(newJob);

		expect(job).toEqual({ ...newJob, id: expect.any(Number) });

		const result = await db.query(
			`SELECT  title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`
		);

		expect(result.rows).toEqual([newJob]);
	});
});

/************************************** findAll */

describe("findAll", function () {
	test("works: no filter", async function () {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				company_handle: "c2",
				equity: "0",
				id: 3,
				salary: 50000,
				title: "IT Engineer",
			},
			{
				company_handle: "c1",
				equity: "0.002",
				id: 2,
				salary: 30000,
				title: "Janitor",
			},
			{
				company_handle: "c1",
				equity: "0",
				id: 1,
				salary: 50000,
				title: "Software engineer",
			},
		]);
	});
});

/************************************** get */

describe("findFilter", function () {
	test("works: with min", async function () {
		let jobs = await Job.findFilter({ minSalary: 30001 });
		expect(jobs).toEqual([
			{
				company_handle: "c2",
				equity: "0",
				id: 3,
				salary: 50000,
				title: "IT Engineer",
			},
			{
				company_handle: "c1",
				equity: "0",
				id: 1,
				salary: 50000,
				title: "Software engineer",
			},
		]);
	});

	test("works: with equity", async function () {
		let jobs = await Job.findFilter({ hasEquity: true });
		expect(jobs).toEqual([
			{
				company_handle: "c1",
				equity: "0.002",
				id: 2,
				salary: 30000,
				title: "Janitor",
			},
		]);
	});

	test("works: with title", async function () {
		let jobs = await Job.findFilter({ title: "engineer" });
		expect(jobs).toEqual([
			{
				company_handle: "c2",
				equity: "0",
				id: 3,
				salary: 50000,
				title: "IT Engineer",
			},
			{
				company_handle: "c1",
				equity: "0",
				id: 1,
				salary: 50000,
				title: "Software engineer",
			},
		]);
	});
});

/************************************** get */

describe("get", function () {
	test("works", async function () {
		let job = await Job.get(1);
		expect(job).toEqual({
			company_handle: "c1",
			equity: "0",
			id: 1,
			salary: 50000,
			title: "Software engineer",
		});
	});

	test("not found if no such job", async function () {
		try {
			await Job.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe("update", function () {
	const updateData = {
		title: "updated",
		salary: 21,
		equity: "0",
	};

	test("works", async function () {
		let updatedJob = await Job.update(1, updateData);
		expect(updatedJob).toEqual({
			...updateData,
			id: 1,
			company_handle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				...updateData,
				id: 1,
				company_handle: "c1",
			},
		]);
	});

	test("works: null fields", async function () {
		const updateDataSetNulls = {
			salary: null,
			equity: null,
		};

		let job = await Job.update(1, updateDataSetNulls);
		expect(job).toEqual({
			id: 1,
			title: "Software engineer",
			company_handle: "c1",
			...updateDataSetNulls,
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				id: 1,
				title: "Software engineer",
				company_handle: "c1",
				...updateDataSetNulls,
			},
		]);
	});

	test("not found if no such job", async function () {
		try {
			await Job.update(0, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test("bad request with no data", async function () {
		try {
			await Job.update(1, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe("remove", function () {
	test("works", async function () {
		await Job.remove(1);
		const res = await db.query("SELECT title FROM jobs WHERE id=1");
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such company", async function () {
		try {
			await Job.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
