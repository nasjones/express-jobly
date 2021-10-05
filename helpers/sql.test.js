const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
	test("testing output", function () {
		const sql = sqlForPartialUpdate(
			{ firstName: "Aliya", age: 32 },
			{ firstName: "first_name", age: "age" }
		);

		expect(sql).toEqual({
			setCols: '"first_name"=$1, "age"=$2',
			values: ["Aliya", 32],
		});
	});
});
