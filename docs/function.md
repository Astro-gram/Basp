# Functions

- Can be passed into other functions as if it were a variable
- Arugment types are optional. Accepts any type if not specified
- Return type is not optional - it must be specified (if you don't want to return anything, use "null")


To call a function:

```c
identifer(args)
```

To declare a function:
```c
fn identifier(args: type): returnType {
    statements
}
```

OR

```c
fn identifier(args): returnType {
    statements
}
```

EXAMPLE:

```c
fn add(num: int, num2: int): int {
    return num + num2
}

add(3, 3)

//Result: 6
```

```c
fn printValue(value): null {
    Print(value)
}

printValue(5)
printValue("Hello")

//Result: 5
//Result: "Hello"
```