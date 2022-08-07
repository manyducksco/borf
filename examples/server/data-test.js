import { makeModel, collectionOf } from "@woofjs/data";

const Post = makeModel({
  key: "id",
  schema: (v) => {
    return v.object({
      id: v.number(),
    });
  },
});

const post = new Post({ id: 1 });

const subscription = post.subscribe((value) => {});

subscription.unsubscribe();
