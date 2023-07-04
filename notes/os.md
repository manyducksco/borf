# Operating System

I want to make an OS from scratch. Current ones are too complicated to effectively teach people how computer software works.

I want to create a learning/teaching OS with a goal of making programming understandable to kids and beginners. The primary interface with the OS is a programming language. The command line interface is a REPL with pretty printing for output. Command history is stored, and you can export your history to a file that can be edited and run. So you can automate a process you've just completed by dumping the history, cleaning it up and saving it as a script.

## Base Types

- Null
- True & False
- Text
  - UTF-16 strings
- Number
  - Can have a fractional component or not
- List
  - Number indexed with any type value, but all values must be the same type
- Object
  - Like a hash or dictionary. Has keys of Text and values of any type
- Function
- Error

```
value = "this is text"
count = 5
list_of_numbers = [1 2 3]
list_of_text = ["first" "second" "third"]
object = [
  name = "Jimbo Jones"
  age = 947
]

# this is a comment

# the following is a function
doubled = {
  # args are available by name on the '@' object
  @.values.map {
    @.value * 2
  }
}

# {} and @ go together; @ always refers to the arguments of the nearest block it's used in.

# call a block and pass arguments
result = doubled(values=list)

# a block that takes a block:

get_number = { Number.random() }

multiply = { |value, block|
  factor = 2

  if block.not_null? {
    factor = block()
  }

  value * factor
}

multiplied = multiply(5) { 10 }
# multiplied.equals?(50) = True

# assignments by reference
numbers = [1 2 3]
same_numbers = numbers
different_numbers = numbers.copy()
```

## Operators

I'm thinking about avoiding operators in favor of more flexible functions on objects.

```
5.times(2) # 10 -- equivalent to 5 * 2
25.divided_by(5) # 5 -- equivalent to 25 / 5

# would this calling signature be parseable?
# object -> method -> argument
5 times 2

# if there was a '*' function on Number, this could be done like:
5 * 2

Number = [
  * = { |value|
    # self is accessible from any function attached to an object, and refers to the object itself.
    self.times(value)
  }
]

# what about pipe?
5 | @ * 2 | @.to_text()

# the code above results in the text value: "10"

class Number

end
```

## Terminal and code reuse

The main UI is a fancy terminal with modern features like autocomplete and syntax highlighting. Programs are written as "blocks", which are standalone scripts written in the language. A block file is named with a `.b` extension. Blocks can be run by calling `run name` at a prompt, where the block is named `name.b`. Blocks can import and run other blocks.

A lot of high level functionality is exposed in the standard library.

An example of a block:

```
block multiply {
  # defines variables that are passed by name when the block is called
  # ones with a default value are optional
  # The string is a doc comment which is shown when running `help multiply`
  takes value "value to multiply"
  takes by=2 "other value by which to multiply"

  # all of some_library's exports are now in this scope
  import some_library

  # only specific_function is now in this scope
  import other_library { specific_function }

  # imported with a different name
  import other_library { specific_function as spec_fn }

  # the value of the last evaluated expression is the function's return value
  value * by
}

# call this block like so:
multiply value=5
```

You could also use a block file by moving these lines to a `multiply.b` file.

```
# in multiply.b

takes value
takes by=2

# all of some_library's exports are now in this scope
import some_library

# only specific_function is now in this scope
import other_library { specific_function }

# imported with a different name
import other_library { specific_function as spec_fn }

# the value of the last evaluated expression is the function's return value
value * by
```

Now on the command line you can run:

```
multiply value=2
# prints 4
```

Thinking:

```
# wrap sub-expressions
multiply value=(multiply value=2) # prints 8
```

Do we need classes/objects? Would just functions suffice?

```
object Dog {
  takes var name # public, accessible from outside after passed to .new
  takes @var name # private, not accessible from outside

  # if arguments are private, this is what a getter and setter looks like
  block name { .name }
  block set_name {
    takes value
    .name = value
  }

  block say {
    takes word
    print "@(.name) says '@(word)'"
  }

  block bark {
    # access other things in this object's scope with .
    .say "borf"
  }

  @block secret {
    print "this block can only be called from within this object scope"
  }
}



var fido = Dog.new name="Fido"
fido.say "ruh" # "Fido says 'ruh'"
fido.bark # "Fido says 'borf'"

# if private
fido.set_name value="Dave"

# if public
fido.name = "Dave"
fido.say "hello" # "Dave says 'hello'"
```
