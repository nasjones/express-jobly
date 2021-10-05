const { BadRequestError } = require("../expressError");

/**  returns object data in a format to be used in sql query
 * dataToUpdate: an object of the new information
 *
 * jsToSql: the names of the columns to be updated matching the keys of the
 * update object
 *
 * return {setCols:a string to be used in a sql query,
 *        values: the data the query will need}
 *
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map(
		(colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
	);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

/**  returns object data in a format to be used in sql query
 *
 *
 *
 * return a string to be used in a sql query,
 *
 */
function sqlCompFilter(values) {
	const keys = Object.keys(values);
	const cols = keys.map((key, idx) => {
		if (key == "name") return `name ILIKE '%${values[key]}%'`;
		else if (key == "maxEmployees")
			return `num_employees <= ${values[key]}`;
		else return `num_employees >= ${values[key]}`;
	});
	return cols.join(" AND ");
}

/**  returns object data in a format to be used in sql query
 *
 *
 * return a string to be used in a sql query,
 *
 */
function sqlJobFilter(values) {
	const keys = Object.keys(values);
	const cols = keys.map((key) => {
		if (key == "title") return `title ILIKE '%${values[key]}%'`;
		else if (key == "hasEquity" && values[key]) return `equity > 0`;
		else return `salary >= ${values[key]}`;
	});
	return cols.join(" AND ");
}

module.exports = { sqlForPartialUpdate, sqlCompFilter, sqlJobFilter };
