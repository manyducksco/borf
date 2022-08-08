import { makeModel, v, collectionOf } from "@woofjs/data";

const Post = makeModel({
  key: "id",
  schema: v.object({
    id: v.number(),
  }),
});

const schema = v.object({
  number: v.number().min(5).max(12),
});

const result = schema.assert({ number: 3 });

const post = new Post({ id: 1 });

const subscription = post.subscribe((value) => {});

subscription.unsubscribe();
