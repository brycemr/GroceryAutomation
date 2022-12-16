let recipeBookOpen = false;
let queueOpen = false;
let mainElement = document.getElementById("main");
let lastView = "home";

//FIND AND SET INITIAL STATE OF BUTTONS
let saveRecipeButton = document.getElementById("saveRecipe");
let saveIngredientButton = document.getElementById("saveIngredient");
let purchaseIngredientsButton = document.getElementById("purchaseIngredients");
let viewRecipeQueueButton = document.getElementById("viewQueue");
let recipeBookButton = document.getElementById("recipeBook");
let searchIngredientButton = document.getElementById("searchIngredient");
let collectRecipeButton = document.getElementById("collectRecipe");

purchaseIngredientsButton.style.display = 'none';
saveIngredientButton.style.display = 'none';
saveRecipeButton.style.display = 'none';
searchIngredientButton.style.display = 'none';
viewRecipeQueueButton.style.display = 'inline';

//Add listeners to all of the buttons
saveIngredientButton.addEventListener("click", () =>{
    pushIngredient();
    pushRecipe();
    viewEditRecipeView();
})

saveRecipeButton.addEventListener("click", () => {
    pushRecipe();
    if(lastView === "recipeBook"){
        openRecipeBook();
    } else{
        populateRecipeQueue();
    }

})

recipeBookButton.addEventListener("click", () => {
    if(recipeBookOpen){
        recipeBookButton.innerText = "Open Recipe Book";
        if(queueOpen){
            populateRecipeQueue();
        } else{
            closeRecipeBook();
        }
    }else {
        openRecipeBook();
        recipeBookButton.innerText = "Close Recipe Book";
    }
    recipeBookOpen = !recipeBookOpen;
})

viewRecipeQueueButton.addEventListener("click", () => {
    if(queueOpen){
        viewRecipeQueueButton.innerText = "View Recipe Queue";
        if(recipeBookOpen){
            openRecipeBook();
        }else{
            closeRecipeBook();
        }
        recipeBookButton.style.display = "inline";
    } else{
        populateRecipeQueue();
        viewRecipeQueueButton.innerText = "Close Recipe Queue";
    }
    queueOpen = !queueOpen;
})

let myRecipes;
let recipeQueue;
let defaultRecipes = [];

function getData(){
    chrome.storage.sync.get({'allRecipes':  defaultRecipes}, function(data){
        myRecipes = data.allRecipes;
    });
    chrome.storage.sync.get({'recipeQueue':  defaultRecipes}, function(data){
        recipeQueue = data.recipeQueue;
    });
}
getData();

let currentRecipe = {
    "name": "",
    "purchaseIngredients": [],
    "checkIngredients": [],
    "instructionsURL": ""
}

let currentIngredient = {
    "name": "",
    "quantity": 1,
    "url": ""
}

//Open and close recipt book functions handle the html changes
function openRecipeBook(){
    lastView = "home";
    let html = "<div id='header'><h2>My Recipe Book</h2><button class='addButton' id='addRecipe'>Add New Recipe to Book</button></div>";
    html += "<hr><ul id='recipeList'>";
    if(typeof recipeQueue !== 'undefined'){
        for(const recipe of myRecipes){
        html += "<li class='recipeListItem'><strong id='recipeName'>"+recipe.name+"</strong>";
        html += "<button class='viewEditRecipe'>View/Edit Recipe</button>";
        html += "<button class='addRecipeToQueue'>Add Recipe to Queue</button></li>";
        }
    }
    html += "</ul>";
    mainElement.innerHTML = html;

    document.getElementById("recipeList").addEventListener('click', function(event) {
        let listItem = event.target.closest('li');
        let recipeName = listItem.innerText.substring(0,listItem.innerText.length - 35);

        currentRecipe = myRecipes.find(recipe => recipe.name === recipeName);
        if(event.target.className === "viewEditRecipe"){
            lastView = "recipeBook";
            viewEditRecipeView();
        }
        if(event.target.className === "addRecipeToQueue"){
            addRecipeToQueue();
        }

    })

    //Available Action Buttons
    collectRecipeButton.style.display = 'none';
    saveIngredientButton.style.display = "none";
    saveRecipeButton.style.display = 'none';
    purchaseIngredientsButton.style.display = "none";
    searchIngredientButton.style.display = 'none';
    viewRecipeQueueButton.style.display = "inline";
    recipeBookButton.style.display = "inline";

    let addRecipeButton = document.getElementById("addRecipe");
    addRecipeButton.addEventListener("click", () =>{
        currentRecipe = {
            "name": "",
            "purchaseIngredients": [],
            "checkIngredients": [],
            "instructionsURL": ""
        }
        viewEditRecipeView();
    })
}

function closeRecipeBook(){
    mainElement.innerHTML = "";
    saveIngredientButton.style.display = 'none';
    purchaseIngredientsButton.style.display = 'none';
    searchIngredientButton.style.display = 'none';
    viewRecipeQueueButton.style.display = 'inline';
    collectRecipeButton.style.display = 'inline';
}

function populateRecipeQueue(){
    getData();
    let html = "<h3>Recipe Queue</h3><hr><ul id='recipeQueue'>";
    if(typeof recipeQueue !== 'undefined'){
        for(const object of recipeQueue){
            html += "<li>"+object.name;
            html += "<button class='viewEditRecipe'>View/Edit Recipe</button>";
            html += "<button class='deleteButton'>Remove from Queue</button></li><br>";
        }
    }
    html += " </ul>";
    mainElement.innerHTML = html;

    collectRecipeButton.style.display = 'none';
    saveIngredientButton.style.display = "none";
    recipeBookButton.style.display = "inline";
    saveRecipeButton.style.display = 'none';
    purchaseIngredientsButton.style.display = "inline";
    viewRecipeQueueButton.style.display = "inline";

    document.getElementById("recipeQueue").addEventListener('click', function(event) {
        let listItem = event.target.closest('li');
        console.log(listItem);
        let recipeName = listItem.innerText.substring(0,listItem.innerText.length - 33);
        if(event.target.className === "viewEditRecipe"){
            currentRecipe = myRecipes.find(recipe => recipe.name === recipeName);
            lastView = "recipeQueue";
            viewEditRecipeView();
        }
        if(event.target.className === "deleteButton"){
            let index = recipeQueue.findIndex(recipe => recipe.name === recipeName);
            if(index !== -1){
                recipeQueue.splice(index, 1);
            }
        
            chrome.storage.sync.set({'recipeQueue': recipeQueue});
        
            populateRecipeQueue();
        }
    })
}

function viewEditRecipeView(){
    let html = "<h3>Enter Recipe details below</h3><br><label for='name'>Recipe Name: </label><input id='name'>";
    html += "<button class='deleteButton' id='deleteRecipe'>Delete this Recipe</button><br>";
    html += "<h3>Ingredients</h3><button class='addButton' id='addIngredient'>Add Ingredient</button><ul id='purchaseIngredients'><h4>Ingredients to Purchase</h4><hr>";
    for(const ingredient of currentRecipe.purchaseIngredients){
        html += "<li><strong>"+ingredient.name+"</strong>";
        html += "<button class='editButton'>Edit Ingredient</button>";
        html += "<button class='deleteButton'>Remove Ingredient</button>";
        html += "<button class='moveIngredient'>Move Ingredient</button></li>";
    }
    html += "</ul><ul id='checkIngredients'><h4>Ingredients at Home</h4><hr>"
    for(const ingredient of currentRecipe.checkIngredients){
        html += "<li><strong>"+ingredient.name+"</strong>";
        html += "<button class='editButton'>Edit Ingredient</button>";
        html += "<button class='deleteButton'>Remove Ingredient</button>";
        html += "<button class='moveIngredient'>Move Ingredient</button></li>";
    }
    html += "</ul><div>";
    mainElement.innerHTML = html;

    document.getElementById("purchaseIngredients").addEventListener('click', function(event) {
        let listItem = event.target.closest('li');
        console.log(listItem);
        let ingredientName = listItem.innerText.substring(0,listItem.innerText.length - 47);
        console.log(ingredientName);

        if(event.target.className === "editButton"){
            currentIngredient = currentRecipe.purchaseIngredients.find(ingredient => ingredient.name === ingredientName);
            console.log(currentIngredient);
            viewEditIngredientView(true);
        }
        if(event.target.className === "deleteButton"){
            let toMove = currentRecipe.purchaseIngredients.findIndex(ingredient=> ingredient.name === ingredientName);
            toMove.purchaseBool = !toMove.purchaseBool;
            viewEditRecipeView();
        }
        if(event.target.className === "moveIngredient"){
            let index = currentRecipe.purchaseIngredients.findIndex(ingredient=> ingredient.name === ingredientName);
            if(index !== -1){
                currentRecipe.checkIngredients.push(currentRecipe.purchaseIngredients[index]);
                currentRecipe.purchaseIngredients.splice(index, 1);
            }

            viewEditRecipeView();
        }
    })

    document.getElementById("checkIngredients").addEventListener('click', function(event) {
        let listItem = event.target.closest('li');
        console.log(listItem);
        let ingredientName = listItem.innerText.substring(0,listItem.innerText.length - 47);
        console.log(ingredientName);

        if(event.target.className === "editButton"){
            currentIngredient = currentRecipe.checkIngredients.find(ingredient => ingredient.name === ingredientName);
            console.log(currentIngredient);
            viewEditIngredientView(false);
        }
        if(event.target.className === "deleteButton"){
            let toMove = currentRecipe.purchaseIngredients.findIndex(ingredient=> ingredient.name === ingredientName);
            toMove.purchaseBool = !toMove.purchaseBool;
            viewEditRecipeView();
        }
        if(event.target.className === "moveIngredient"){
            let index = currentRecipe.checkIngredients.findIndex(ingredient=> ingredient.name === ingredientName);
            if(index !== -1){
                currentRecipe.purchaseIngredients.push(currentRecipe.checkIngredients[index]);
                currentRecipe.checkIngredients.splice(index, 1);
            }

            viewEditRecipeView();
        }
    })

    saveIngredientButton.style.display = "none";
    saveRecipeButton.style.display = 'inline';
    purchaseIngredientsButton.style.display = "none";
    viewRecipeQueueButton.style.display = "none";
    recipeBookButton.style.display = "none";

    document.getElementById("name").value = currentRecipe.name;
    
    let addIngredientButton = document.getElementById("addIngredient");
    addIngredientButton.addEventListener("click", () =>{
        currentIngredient = {
            "name": "",
            "quantity": 1,
            "url": ""
        }
        currentRecipe.name = document.getElementById("name").value;
        viewEditIngredientView(true);
    })

    let deleteRecipeButton = document.getElementById("deleteRecipe");
    deleteRecipeButton.addEventListener("click", () =>{
        currentRecipe.name = document.getElementById("name").value;
        deleteRecipe();
    })
    
}

function pushRecipe(){
    
    let index = myRecipes.findIndex(recipe => recipe.name === currentRecipe.name);
    if(index !== -1){
        myRecipes.splice(index, 1);
    }
    myRecipes.push(currentRecipe);

    //Replace in Queue if applicable
    index = recipeQueue.findIndex(recipe => recipe.name === currentRecipe.name);
    if(index !== -1){
        recipeQueue.splice(index, 1);
        recipeQueue.push(currentRecipe);
    }

    chrome.storage.sync.set({'recipeQueue': recipeQueue});
    
    chrome.storage.sync.set({'allRecipes': myRecipes});
}

function deleteRecipe(){
    let index = myRecipes.findIndex(recipe => recipe.name === currentRecipe.name);
    if(index !== -1){
        myRecipes.splice(index, 1);
    }

    chrome.storage.sync.set({'allRecipes': myRecipes});

    openRecipeBook();
}

function addRecipeToQueue(){
    recipeQueue.push(currentRecipe);
    chrome.storage.sync.set({'recipeQueue': recipeQueue});
    alert("Added " + currentRecipe.name + " to your recipe queue");
}

function viewEditIngredientView(purchase){
    console.log(currentIngredient);
    let html = "<h3>Enter Ingredient details below</h3><br>";
    html += "<label for='itemName'>Ingredient</label><input id='itemName'></input><br>";
    html += "<label for='itemURL'>URL for Ingredient</label><input id='itemURL'></input><a target='_blank' href="
    +currentIngredient.url+">Ingredient Here</a><br>";
    html += "<label for='quantity'>Quantity</label><input type='number' id='quantity'></input><br>";
    html += "<label for='purchaseOrCheck'>Purchase this Item everytime you make the recipe?</label><input type='checkbox' id='purchaseOrCheck'></input><br>";
    mainElement.innerHTML = html;

    document.getElementById("itemName").value = currentIngredient.name;
    document.getElementById("itemURL").value = currentIngredient.url;
    document.getElementById("quantity").value = currentIngredient.quantity;
    document.getElementById("purchaseOrCheck").checked = purchase;

    saveIngredientButton.style.display = "inline";
    saveRecipeButton.style.display = 'none';
    purchaseIngredientsButton.style.display = "none";
    searchIngredientButton.style.display = 'inline';
}

function pushIngredient(){
    currentIngredient.name = document.getElementById("itemName").value;
    currentIngredient.url = document.getElementById("itemURL").value;
    currentIngredient.quantity = document.getElementById("quantity").value;
    let purchaseBool = document.getElementById("purchaseOrCheck").checked;
    let index = -1;
    index = currentRecipe.purchaseIngredients.findIndex(ingredient => ingredient.name === currentIngredient.name);
    if(index !== -1){
        currentRecipe.purchaseIngredients.splice(index, 1);
    }
    index = currentRecipe.checkIngredients.findIndex(ingredient => ingredient.name === currentIngredient.name);
    if(index !== -1){
        currentRecipe.checkIngredients.splice(index, 1);
    }
    if(purchaseBool){
        currentRecipe.purchaseIngredients.push(currentIngredient);
    } else{
        currentRecipe.checkIngredients.push(currentIngredient);
    }
    currentIngredient = {
        "name": "",
        "quantity": 1,
        "url": ""
    }
}

function back(){
    if(currentView === "ingredient"){
        viewEditRecipeView();
    } else if(currentView === "recipe"){
        if(lastView === "queue"){
            populateRecipeQueue();
        } else {
            openRecipeBook();
        }
    } else {
        closeRecipeBook();
    }

}


// given button to view queue at beginning, this will give us time to get the data, then in that view give choice to order.

//Add instructions that say if the recipe has been updated the user should remove it from queue and readd it, later add code to do this
//automatically