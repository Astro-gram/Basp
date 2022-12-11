# Structure

```c
struct Person {
    age: int,
    name: string
}

Person person = new Person(5, "jeff")

Print(person)
//Result: Person { age: 5, name: "jeff" }
```

Both properties in struct 'Person' are not writable.

To make it writable:

```c
struct Person {
    !age: int,
    !name: string
}

Person person = new Person(5, "jeff")
person.age = 6

//Result: Person { age: 6, name: "jeff" }
```