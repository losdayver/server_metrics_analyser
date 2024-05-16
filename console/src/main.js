const express = require("express");
const path = require("path");

const app = express();
const port = 4500;
const proxy = "/diploma";

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "public", "views"));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Route for rendering EJS templates
app.get("/:pageName", (req, res) => {
    res.render("index", {
        response: res,
        mainContatentPageName: req.params.pageName,
        proxy: proxy
    });
});

app.get("/", (req, res) => {
    res.redirect(proxy + "/dashboard");
});

app.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});
