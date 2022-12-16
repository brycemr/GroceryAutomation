let addItemsToCart = document.getElementById("purchaseIngredients");
let collectRecipe = document.getElementById("collectRecipe");
let searchIngredient = document.getElementById("searchIngredient");

let userRecipes;
let defaultUserRecipes = [];
let unaddedItems = [];
let currentItem;

chrome.storage.sync.get({'recipeQueue':  defaultUserRecipes}, function(data){
    userRecipes = data.recipeQueue;
});

console.log(userRecipes);

//HANDLE COLLECTING A RECIPE FROM ALLRECIPES.COM
collectRecipe.addEventListener("click", async () => {
    let activeTabID = 0;
    await chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        console.log(tabs[0]);
        activeTabID = tabs[0].id;        
    });
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    await delay(2000);
    console.log(activeTabID);
    let defaultRecipes = [];
    let currentAllRecipes;
    console.log("Get Data");
    chrome.storage.sync.get({'allRecipes':  defaultRecipes}, function(data){
        currentAllRecipes = data.allRecipes;
    });
    await delay(3000);
    await chrome.scripting.executeScript({
        target: { tabId: activeTabID },
        function: collectThisRecipe,
        args: [currentAllRecipes],
    });
    console.log(currentAllRecipes);
})


async function collectThisRecipe(currentAllRecipes){
    const recipeToCollect = {
        "name": "",
        "purchaseIngredients": [],
        "checkIngredients": [],
        "instructionsURL": ""
    }
    
    let ingredientToCollect = {
    };

    console.log("We have this data:")
    console.log(currentAllRecipes);
    recipeToCollect.name = document.title;
    console.log("Adding recipe to my Book");
    let ingredientsElement = document.querySelector("[class='mntl-structured-ingredients__list']");
    let ingredientsList = ingredientsElement.getElementsByClassName("mntl-structured-ingredients__list-item");
    console.log(ingredientsList);
    for(const ingredientElement of ingredientsList){
        let newIngredient = Object.create(ingredientToCollect);
        newIngredient.name = ingredientElement.querySelector("[data-ingredient-name='true']").innerText;
        newIngredient.quantity = 1;
        recipeToCollect.purchaseIngredients.push(newIngredient);
    }
    console.log(recipeToCollect);
    let index = currentAllRecipes.findIndex(recipe => recipe.name === recipeToCollect.name);
    if(index !== -1){
        currentAllRecipes.splice(index, 1);
    }
    currentAllRecipes.push(recipeToCollect);
    console.log(currentAllRecipes);
    await chrome.storage.sync.set({'allRecipes': currentAllRecipes});
    await delay(3000);
}

//HANDLE SEARCHING FOR AN INGREDIENT ON WALMART.COM GIVEN A NAME
searchIngredient.addEventListener("click", async () => {
    //search for current ingredient
    console.log("yoink");
    
    let ingredientToSearch = currentIngredient;
    let urlEnd = convertNameToURL(ingredientToSearch.name);
    let searchURL = "https://www.walmart.com/search?q="+urlEnd;
    await chrome.tabs.create({
        "active": false,
        url: searchURL
    });

    let queryOptions = {url: searchURL};
    console.log(queryOptions);
    let [tab] = await chrome.tabs.query(queryOptions);
    await delay(5000);
    console.log("Now searching store")
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: findBestMatch,
        args: [ingredientToSearch, currentRecipe.name]
    },
    (injectionResults) => {
        console.log(injectionResults);
        currentIngredient.url = injectionResults[0].result;
        console.log(currentIngredient);

        //modify recipe to house new ingredient
        index = currentRecipe.purchaseIngredients.findIndex(ingredient => ingredient.name === currentIngredient.name);
        if(index !== -1){
            currentRecipe.purchaseIngredients.splice(index, 1);
            currentRecipe.purchaseIngredients.push(currentIngredient);
        }
        index = currentRecipe.checkIngredients.findIndex(ingredient => ingredient.name === currentIngredient.name);
        if(index !== -1){
            currentRecipe.checkIngredients.splice(index, 1);
            currentRecipe.checkIngredients.push(currentIngredient);
        }
        pushRecipe();
        viewEditIngredientView(true);
    });

    
})

function convertNameToURL(name){
    //need to conver 1/2 and irregularities to a searchable text
    let nameCopy = "";
    for(let i = 0; i < name.length; i++){
        
        if(name.charAt(i) === " "){
            nameCopy +=  "%20";
        }else {
            nameCopy += name.charAt(i);
        }
    }
    console.log(nameCopy);
    return nameCopy;
}

async function findBestMatch(ingredientToSearch, recipeName){

    //get the first three rows of prices
    let products = document.querySelectorAll("[data-automation-id='product-price']");
    console.log(products);

    let bestItem;
    let bestPrice = +products[0].getElementsByTagName("div")[0].innerHTML.slice(1); 
    console.log(bestPrice);
    products.forEach((item) => {
        console.log(item);
        
        let currPrice = +item.getElementsByTagName("div")[0].innerHTML.substring(1);
        console.log(item.getElementsByTagName("div")[0].innerHTML);
        console.log(currPrice);

        if(currPrice < bestPrice){
            bestPrice = currPrice;
            bestItem = item;
        }

    });


    console.log("The best price is " + bestPrice);
    console.log(bestItem);

    console.log(bestItem.closest("[data-testid='list-view']").previousElementSibling.href);
    let bestURL = bestItem.closest("[data-testid='list-view']").previousElementSibling.href
    //let bestTitle = bestItem.closest("div").querySelector("[data-automation-id='product-title").innerText;
    //console.log(bestTitle);
    //create new product
    //let product = {
       // url: bestURL,
      //  price: bestPrice,
       // title: bestTitle
    //}
    //console.log(product);
    return bestURL;
}

//HANDLE POPULATING A WALMART.COM CART WITH ALL QUEUED RECIPES
addItemsToCart.addEventListener("click", async () => {
    chrome.storage.sync.get({'recipeQueue':  defaultUserRecipes}, function(data){
        userRecipes = data.recipeQueue;
    });
    await delay(2000);
    alert("Now Adding Ingredients to Walmart Cart, please do not close or open any tabs in this window");
    for(const recipe of userRecipes) {
        console.log("Current Recipe: " + recipe.name);
        for(const ingredient of recipe.purchaseIngredients){
            for(let i = 0; i < ingredient.quantity; ++i){
                console.log("Current Ingredient: " + ingredient.name);
                currentItem = ingredient.name;
                await chrome.tabs.create({
                  "active": false,
                 url: ingredient.url
                });
                await addItem(ingredient.url);
            }
        }
    }
    chrome.tabs.create({
        //set active back to true when done testing
        "active": true,
        url: "https://www.walmart.com/cart"
    });
    let queryOptions = {url: "https://www.walmart.com/cart"};
    let [tab] = await chrome.tabs.query(queryOptions);
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: alertCheckIngredients,
        args: [userRecipes],
    });
})

async function addItem(ingredientURL) {
    let queryOptions = {url: ingredientURL};
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log("I pushed the button");
    await delay(5000);
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: addToCart,
    });

    
    //now that item has been added, remove tab from chrome
    await chrome.tabs.remove(tab.id);
}

async function addToCart() {
    let container = document.querySelector('[data-testid=add-to-cart-section]');
    let buttons = container.getElementsByTagName("button");
    let cartItemNumBefore = document.getElementById('cart-badge').innerText;
    //Check that item was added by looking to see if cart number changed id='cart-badge' .innerText
    buttons[buttons.length-1].click();
    console.log("Inside add to Cart");
    
    await delay(2000);
    if(document.getElementById('cart-badge').innerText !== cartItemNumBefore){
        unaddedItems.push(currentItem);
    }
}

async function alertCheckIngredients(allRecipes) {
    console.log("We should alert our boi");
    let text = "All ingredients to purchase have been added to the cart. Before submitting the order, verify that you have the following ingredients at home: \n\n"
    console.log(allRecipes)
    for(const currRecipe of allRecipes){
        for(const ingredient of currRecipe.checkIngredients){
            text += ingredient.name + "\n";
        }
    }
    text += "\n If you are missing any of the above ingredients, add them to your cart before ordering.";
    text += "\n The following items were unadded to the cart"
    for(const item of unaddedItems){
        text += item + "\n";
    }
    alert(text);
    console.log(text);
}

const delay = ms => new Promise(res => setTimeout(res, ms));