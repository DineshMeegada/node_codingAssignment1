const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, isValid } = require("date-fns");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;

const InitializeDBAndServer = async (request, response) => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log(`localhost is running at "http://localhost:3000/"`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

// API 1

const checkPriority = (priority, response) => {
  if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
};

const checkStatus = (status, response) => {
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

const checkCategory = (category, response) => {
  if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

const convertDbToResponse = (eachTodoItem) => {
  return {
    id: eachTodoItem.id,
    todo: eachTodoItem.todo,
    priority: eachTodoItem.priority,
    status: eachTodoItem.status,
    category: eachTodoItem.category,
    dueDate: eachTodoItem.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  try {
    const { search_q = "", priority, status, category } = request.query;

    let getTodosArray = "";
    if (
      priority !== undefined &&
      status !== undefined &&
      category !== undefined
    ) {
      checkPriority(priority, response);
      checkCategory(category, response);
      checkStatus(status, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority LIKE '${priority}'
                    AND status LIKE '${status}'
                    AND category LIKE '${category}'`;
    } else if (priority !== undefined && status !== undefined) {
      checkPriority(priority, response);
      checkStatus(status, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority LIKE '${priority}'
                    AND status LIKE '${status}'`;
    } else if (priority !== undefined && category !== undefined) {
      checkPriority(priority, response);
      checkCategory(category, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority LIKE '${priority}'
                    AND category LIKE '${category}'`;
    } else if (status !== undefined && category !== undefined) {
      checkCategory(category, response);
      checkStatus(status, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND status LIKE '${status}'
                    AND category LIKE '${category}'`;
    } else if (priority !== undefined) {
      checkPriority(priority, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority LIKE '${priority}'`;
    } else if (status !== undefined) {
      checkStatus(status, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND status LIKE '${status}'`;
    } else if (category !== undefined) {
      checkCategory(category, response);
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND category LIKE '${category}'`;
    } else {
      getTodosArray = `
                SELECT *
                FROM todo
                WHERE 
                    todo LIKE '%${search_q}%'`;
    }

    const requiredTodos = await database.all(getTodosArray);
    response.send(
      requiredTodos.map((eachTodo) => convertDbToResponse(eachTodo))
    );
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`);
    response.status(400);
  }
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoItemQuery = `SELECT * FROM todo WHERE id = ${todoId};`;

  const todoItem = await database.get(getTodoItemQuery);
  response.send(convertDbToResponse(todoItem));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 09, 22), "yyyy-MM-dd");
  const getTodoQuery = `SELECT * FROM todo WHERE due_date = ${date};`;
  const Item = await database.get(getTodoQuery);
  response.send(Item);
});

// API 4

const checkDueDate = (dueDate, response) => {
  dueDate = format(dueDate, "yyyy-MM-dd");
  isDateValid = isValid(dueDate);
  if (isDateValid !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  checkCategory(category, response);
  checkPriority(priority, response);
  checkStatus(status, response);
  checkDueDate(dueDate, response);

  const postTodoQuery = `
        INSERT INTO
            todo(id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate});`;

  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;

  let updateTodoQuery;
  if (todo !== undefined) {
    updateTodoQuery = `
            UPDATE todo
            SET todo = '${todo}'
            WHERE id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (priority !== undefined) {
    updateTodoQuery = `
            UPDATE todo
            SET priority = '${priority}'
            WHERE id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Priority Updated");
  } else if (status !== undefined) {
    updateTodoQuery = `
            UPDATE todo
            SET status = '${status}'
            WHERE id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Status Updated");
  } else if (category !== undefined) {
    updateTodoQuery = `
            UPDATE todo
            SET category = '${category}'
            WHERE id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Category Updated");
  } else if (dueDate !== undefined) {
    updateTodoQuery = `
            UPDATE todo
            SET due_date = '${dueDate}'
            WHERE id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Due Date Updated");
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
