"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlJobFilter } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be { title, salary, equity, company_handle }
	 *
	 * Returns { id, title, salary, equity, company_handle }
	 *
	 * */

	static async create({ title, salary, equity, company_handle }) {
		const result = await db.query(
			`INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
			[title, salary, equity, company_handle]
		);
		const job = result.rows[0];

		return job;
	}

	/** Find all jobs.
	 *
	 * Returns [{title, salary, equity, company_handle}, ...]
	 * */

	static async findAll() {
		const jobsRes = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           ORDER BY title`
		);
		return jobsRes.rows;
	}

	/** Find jobs filtered by input.
	 *
	 * Returns [{ title, salary, equity, company_handle }, ...]
	 * */

	static async findFilter(filters) {
		let input = {};
		Object.keys(filters).map((key) => {
			if (["title", "minSalary", "hasEquity"].includes(key)) {
				input[key] = filters[key];
			}
		});
		const query = sqlJobFilter(input);
		const jobsRes = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE ${query}
           ORDER BY title`
		);
		return jobsRes.rows;
	}

	/** Given a job id, return data about a job.
	 *
	 * Returns { id, title, salary, equity, company_handle }
	 *
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(id) {
		const jobRes = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
			[id]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job with id: ${id}`);

		return job;
	}

	/** Update job data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {title, salary, equity}
	 *
	 * Returns {id, title, salary, equity, company_handle }
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {});

		const idVarIdx = "$" + (values.length + 1);
		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle`;
		const result = await db.query(querySql, [...values, id]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job with id: ${id}`);

		return job;
	}

	/** Delete given company from database; returns undefined.
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id, title`,
			[id]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job with id: ${id}`);

		return job;
	}
}

module.exports = Job;
