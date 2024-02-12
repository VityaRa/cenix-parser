const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const formatter = require("./formatter");
const SCREENSHOT_PATH = "screenshot.jpg";
const PRODUCT_INFO_PATH = "product.txt";
const SCREENSHOT_OPTIONS = { path: SCREENSHOT_PATH, fullPage: true };

const dataSelectors = {
  actualPrice: ".Price_role_discount__l_tpE",
  oldPrice: ".Price_role_old__r1uT1",
  reviews: ".ActionsRow_button__g8vnK",
  rating: ".Rating_value__S2QNR",
};

const fields = {
  actualPrice: {
    method: formatter.actualPrice,
    selector: dataSelectors.actualPrice,
  },
  oldPrice: {
    method: formatter.oldPrice,
    selector: dataSelectors.oldPrice,
  },
  reviews: {
    method: formatter.reviews,
    selector: dataSelectors.reviews,
  },
  rating: {
    method: formatter.rating,
    selector: dataSelectors.rating,
  },
};

const saveProductResult = async (
  { price, priceOld, rating, reviewCount },
  filePath = PRODUCT_INFO_PATH
) => {
  await fs.writeFile(filePath, 
    `price=${price}\npriceOld=${priceOld}\nrating=${rating}\nreviewCount=${reviewCount}\n`);
  console.log(`Product information saved as ${filePath}`);
};

const getInnerText = async (page, selector) => {
  try {
    const result = await page.$eval(selector, (el) => el.textContent);
    return result;
  } catch (e) {
    // console.error('Unsuccess getInnerText',e);
    return null;
  }
};

const getProductData = async (page) => {
  console.log("getProductData; start");
  const promises = [
    getInnerText(page, fields.actualPrice.selector),
    getInnerText(page, fields.oldPrice.selector),
    getInnerText(page, fields.rating.selector),
    getInnerText(page, fields.reviews.selector),
  ];


  const [price, priceOld, rating, reviewsCount] = await Promise.all(promises);
  console.log('Unformatted data: ', {price, priceOld, rating, reviewsCount});
  return {
    price: fields.actualPrice.method(price),
    priceOld: fields.oldPrice.method(priceOld),
    rating: fields.rating.method(rating),
    reviewCount: fields.reviews.method(reviewsCount),
  };
};

async function getElementFromListByText(page, listSelector, searchText) {
  const elements = await page.$$(listSelector);

  for (const element of elements) {
    const textContent = await page.evaluate((el) => el.textContent, element);
    if (textContent.includes(searchText)) {
      return element;
    }
  }

  return null;
}

const pickRegion = async (page, region) => {
  const { listSelector, regionBtnSelector, listItemSelector } = {
    listSelector: ".UiRegionListBase_list__cH0fK",
    listItemSelector: '.UiRegionListBase_item___ly_A',
    regionBtnSelector: ".Region_region__6OUBn",
  };

  const currentRegion = await getInnerText(page, regionBtnSelector);
  if (currentRegion === region) {
    console.log("Skipping region set");
    return;
  }
  console.log("Picking region: ", region);
  await page.waitForSelector(regionBtnSelector);
  await page.click(regionBtnSelector);
  console.log("Opening region modal");
  console.log("Waiting for region modal...");
  await page.waitForSelector(listSelector);
  console.log("Region modal ready");

  const regionElement = await getElementFromListByText(
    page,
    listItemSelector,
    region
  );

  if (!regionElement) {
    throw new Error("No region found: ", region);
  }

  await regionElement.click();
  console.log('Region selected');
  await page.waitForNavigation();
  await page.waitForSelector(".Title_title__nvodu");
};

async function getProductInfo(url, region) {
  console.log(`Starting work with url = ${url}, region = ${region}`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1200 });
  await page.goto(url);
  await pickRegion(page, region);
  await page.screenshot(SCREENSHOT_OPTIONS);
  console.log(`Screenshot saved as ${SCREENSHOT_PATH}`);
  const productData = await getProductData(page);
  console.log('Formatted data: ', productData);
  console.log(`Products data parsed`);
  await saveProductResult(productData);
  await browser.close();
}

const url = process.argv[2];
const region = process.argv[3];

if (!url || !region) {
  console.error("Please provide a valid URL and region as arguments.");
} else {
  getProductInfo(url, region);
}
