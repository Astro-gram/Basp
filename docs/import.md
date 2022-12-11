# Imports

Import data from other basp files

### Structured Result

<br/>

file1.basp
```py
import FoodMenu from "./file2.basp" as Menu

Print(Menu)

//Result: Export { FoodMenu: "Food 1: Chicken | Food 2: Steak" }
```

file2.basp
```cs
string FoodMenu = "Food 1: Chicken | Food 2: Steak"
```

Import gives a ```Export``` structure as a return value which contains all of the data imported.

<br/>

Import also allows you to import more than one piece of data:

file1.basp

```py
import FoodMenu, Drinks from "./file2.basp" as Menu

Print(Menu)

//Result: Export { FoodMenu: "Food 1: Chicken | Food 2: Steak", Drinks: "Drink 1: Coke | Drink 2: Pepsi" }
```

file2.basp

```cs
string Menu = "Food 1: Chicken | Food 2: Steak"
string Drinks = "Drink 1: Coke | Drink 2: Pepsi"
```

<br/>

### Destructured Result

file1.basp
```py
import FoodMenu, Drinks from "./file2.basp"

Print(FoodMenu)
Print(Drinks)

//Result: "Food 1: Chicken | Food 2: Steak"
//Result: "Drink 1: Coke | Drink 2: Pepsi"
```

file2.basp
```cs
string FoodMenu = "Food 1: Chicken | Food 2: Steak"
string Drinks = "Drink 1: Coke | Drink 2: Pepsi"
```