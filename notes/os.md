# Operating System

I want to make an OS from scratch. Current ones are too complicated to effectively teach people how computer software works.

I want to create a learning/teaching OS with a goal of making programming understandable to kids and beginners. The primary interface with the OS is a programming language. OS functions are exposed as libraries.

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
