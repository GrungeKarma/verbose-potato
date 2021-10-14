require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const fs = require("fs");
const puppeteer = require("puppeteer");
const resizeImg = require('resize-img');

mongoose.connect(process.env.DB_CONNECT);
const app = express();
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once(
  "open",
  console.log.bind(console, "Successfully opened connection to Mongo!")
);

const myMiddleware = (request, response, next) => {
  // do something with request and/or response
  console.log(request.method, request.path);
  next(); // tell express to move to the next middleware function
};

// CORS Middleware
const cors = (req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type, Accept,Authorization,Origin"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
};

app.use(myMiddleware); // use the myMiddleware for every request to the app
app.use(express.json({ limit: "5MB" }));
app.use(cors);

const listSchema = new mongoose.Schema({
  image: String,
  name: [String],
  price: String,
  link: String
});
const completeListSchema = new mongoose.Schema({
  list: String
});
//contract of the data

//convert schema a Model
const List = mongoose.model("List", listSchema);
const CompleteList = mongoose.model("CompleteList", completeListSchema);


app.post("/gen_data", (request, response) => {
  const rand1 = Math.random()
    .toString(16)
    .substr(2, 8);
  //generate random string to use as image name for manipulation

  function amazonItemScraper(url) {
    (async () => {
      fs.mkdir("./image", err => {
        if (err) {
          return console.error(err);
        }
        console.log("Directory created successfully!");
      });
      //create a directory to store image

      let imageUrl = url;
      let imagePath = `./image`;
      //assign a name to url and the path for saving image

      const browser = await puppeteer.launch({ args: ["--no-sandbox"] })
      let page = await browser.newPage();
      page.setDefaultTimeout(7000);
      //launch puppeteer

      await page.goto(imageUrl).catch(e => {
        response.sendStatus(500).json(e)
        process.exit()


      }), { waitUntil: 'networkidle0', timeout: 0 }

      //send puppeteer to the url and waits until everything is rendered

      await page.waitForSelector("#landingImage");
      let element1 = await page.$("#landingImage");
      let save = `${imagePath}/${rand1}.png`;
      await element1.screenshot({ path: save });
      //screenshot and save the image

      await page.waitForSelector("#productTitle");
      //send browser to url and waits for rendering and the selector

      let nameGen = await page.evaluate(() => {
        const nameRegex = /[^\s*].*[^\s*]/;
        //regex to remove the spaces in the html content

        let name = document.getElementById("productTitle").textContent;
        let cleanName = name.match(nameRegex); //apply regex from the element
        return cleanName;
        // grabs name of the item
      });

      const priceSelectors = [
        "#priceblock_ourprice",
        "#priceblock_dealprice"
        /* more here if you find more selectors */
      ];
      //define price selectors

      await page.waitForFunction(
        priceSelectors => document.querySelectorAll(priceSelectors).length,
        {},
        priceSelectors // pass priceSelectors to wairForFunction
      );

      const pricer = await page.evaluate(priceSelectors => {
        const priceRegex = /^\D\d+(\.\d+)?$/;
        //define regex for testing

        const asSingleSelector = priceSelectors.join(",");
        const priceElements = document.querySelectorAll(asSingleSelector);
        let price;
        // combines the price selectors and selects them

        priceElements.forEach(item => {
          if (
            item && // item is not null
            item.innerHTML && // innerHTML exists
            priceRegex.test(item.innerHTML)
          ) {
            // make sure string is a price
            price = item.innerHTML;
          }
        });
        return price;
      }, priceSelectors);
      // pass priceSelectors to evaluate

      await browser.close();
      //closes puppeteer

      const resize = (async () => {
        const image = await resizeImg(fs.readFileSync(`${save}`), {
          width: 125,
          height: 150
        });
        fs.writeFileSync(`${save}`, image);
      })();
      //resize png for card display

      await resize;

      const convertImageBase64 = image => {
        let bitmap = fs.readFileSync(image);
        let base64 = new Buffer.from(bitmap).toString("base64");
        return base64;
      };
      //convert image to base64 for database storage

      let scraperPayload = {
        link: request.body.link,
        name: nameGen,
        price: pricer,
        image: convertImageBase64(save)
      };
      //convert data to object

      fs.rmdir("./image", { recursive: true, force: true }, err => {
        if (err) {
          return console.log("error occurred in deleting directory", err);
        }
        console.log("Directory deleted successfully");
      });
      //remove the directory and image after processing

      await scraperPayload;
      //make sure data is ready

      const finalPayload = new List(scraperPayload);
      //convert object to schema

      console.log(finalPayload);
      //info for server monitoring

      finalPayload.save((err, item) => {
        //save item to database

        return err ? response.sendStatus(500).json(err) : response.json(item);
        //returns processed data
      });
    })().catch(e => response.sendStatus(500).json(e));
  }

  console.log(request.body.link);
  //backend data monitoring
  try {
    amazonItemScraper(request.body.link.trim());
    //call function to process data
  } catch (err) {
    response.sendStatus(500).json(err)
  }
});

app.post('/complete_list', (request, response) => {
  const rand1 = Math.random()
    .toString(16)
    .substr(2, 8);

  fs.mkdir("./download", err => {
    if (err) {
      return console.error(err);
    }
    console.log("Directory created successfully!");
  });

  let monkey = request.body.html;
  console.log(monkey);
  fs.writeFile(`./download/list${rand1}.html`, monkey, function (err) {
    if (err) return console.log(err);
    console.log('success');
  });
  response.status(200).json({ filename: `list${rand1}.html` });

});

app.post('/download', function (request, response) {
  let monkey = `./download/${request.body.filename}`;
  console.log(monkey);
  response.download(monkey);
  fs.rmdir("./download", { recursive: true, force: true }, err => {
    if (err) {
      return console.log("error occurred in deleting directory", err);
    }
    console.log("Directory deleted successfully");
  });

});

app.route("/**").get((request, response) => {
  response.status(404).json({ message: "Not Found" });
});

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
