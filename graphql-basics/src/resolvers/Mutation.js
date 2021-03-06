import uuidv4 from "uuid/v4";
import { Organizations } from "aws-sdk";
const Mutation = {
  createUser(parent, args, { db }, info) {
    const emailTaken = db.users.some(user => user.email == args.data.email);
    if (emailTaken) {
      throw new Error("Email Taken");
    }
    const user = {
      id: uuidv4(),
      ...args.data
    };
    db.users.push(user);
    return user;
  },
  deleteUser(parent, args, { db }, info) {
    const userIndex = db.users.findIndex(user => user.id == args.id);
    if (userIndex === -1) {
      throw new Error("User Not found");
    }
    const removedUser = db.users.splice(userIndex, 1);

    // Remove Posts and commments on that post
    db.posts = db.posts.filter(post => {
      //check if the post was created by the user we deleted
      const match = post.author === args.id;
      if (match) {
        db.comments = db.comments.filter(comment => comment.post !== post.id);
      }
      return !match;
    });
    db.comments = db.comments.filter(comment => comment.author !== args.id);
    return removedUser[0];

    //Remove comments
  },
  updateUser(parent, args, { db }, info) {
    const user = db.users.find(user => user.id === args.id);
    if (!user) {
      throw new Error("User Not Found");
    }
    if (typeof args.data.email === "string") {
      const emailTaken = db.users.find(user => user.email == args.data.email);
      if (emailTaken) {
        throw new Error("Email Already Taken");
      }
      user.email = args.data.email;
    }
    if (typeof args.data.name === "String") {
      user.name = args.data.name;
    }
    if (typeof args.data.age !== "undefined") {
      user.age = data.age;
    }
    return user;
  },
  createPost(parent, args, { db, pubsub }, info) {
    const isAuthor = db.users.some(user => user.id == args.data.author);
    if (!isAuthor) {
      throw new Error("No User Found");
    }
    const post = {
      id: uuidv4(),
      ...args.data
    };
    db.posts.push(post);
    pubsub.publish("post", { post: { mutation: "CREATED", data: post } });
    return post;
  },
  deletePost(parent, args, { db, pubsub }, info) {
    const postIndex = db.posts.findIndex(post => post.id === args.id);
    if (postIndex === -1) {
      throw new Error("Invalid Post ID");
    }
    const [deletedPost] = db.posts.splice(postIndex, 1);
    db.comments = db.comments.filter(comment => comment.post !== args.id);
    pubsub.publish("post", {
      post: { mutation: "DELETED", data: deletedPost }
    });
    return deletedPost;
  },
  updatePost(parent, args, { db }, info) {
    //If we have a published value on the post in that case we have some cases
    // if(original.published && !new.published){delete}
    // if(!original.published && new.published){create}
    // else update
    const { id, data } = args;
    const post = db.posts.find(post => post.id === id);
    if (!post) {
      throw new Error("No Post Found");
    }
    if (typeof data.title === "String") {
      post.title = data.title;
    }
    if (typeof data.body === "String") {
      post.body = data.body;
    }
    pubsub.publish("post", { mutation: "UPDATED", data: post });
    return post;
  },
  deleteComment(parent, args, { db, pubsub }, info) {
    const commentIndex = db.comments.findIndex(
      comment => Comment.id === args.id
    );
    if (commentIndex === -1) {
      throw new Error("Invalid Comment ID");
    }
    [deletedComment] = db.comments.splice(commentIndex, 1);
    pubsub.publish(`comment ${deletedComment.post}`, {
      mutation: "DELETED",
      data: deletedComment
    });
    return deletedComment;
  },
  createComment(parent, args, { db, pubsub }, info) {
    const PostFound = db.posts.some(post => post.id == args.data.post);
    const isAuthor = db.users.some(user => user.id == args.data.author);
    if (!PostFound || !isAuthor) {
      throw new Error("Invalid Post or Author");
    }
    const comment = {
      id: uuidv4(),
      ...args.data
    };
    db.comments.push(comment);
    pubsub.publish(`comment ${args.data.post}`, {
      mutation: "CREATED",
      data: comment
    });
    return comment;
  },
  updateComment(parent, args, { db }, info) {
    const { id, data } = args;
    const comment = db.comments.find(comment => comment.id === id);
    if (!comment) {
      throw new Error("No Commnet Found");
    }
    if (typeof data.text === "String") {
      comment.text = comment.text;
    }
    pubsub.publish(`comment ${args.data.post}`, {
      mutation: "UPDATED",
      data: comment
    });
    return comment;
  }
};
export default Mutation;
