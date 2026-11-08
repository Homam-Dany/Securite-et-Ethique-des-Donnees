// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MiniSocial {
    struct Post {
        string message;
        address author;
    }

    Post[] public posts;

    function publishPost(string memory _message) public {
        Post memory newPost = Post(_message, msg.sender);
        posts.push(newPost);
    }

    function getPost(uint index) public view returns (string memory, address) {
        require(index < posts.length, "Index invalide");
        Post memory p = posts[index];
        return (p.message, p.author);
    }

    function getTotalPosts() public view returns (uint) {
        return posts.length;
    }
}
