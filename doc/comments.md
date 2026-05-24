# Comments

The `spec` website supports a basic system of posting and viewing comments, which may be enabled using the 
[config options](./config.md) of `displayComments` and `allowComments`. Comments require visitors to note down a name
and email address, and to pass a basic captcha by typing down the tag of the current page. 

Visitors may comment using the same [LaTeX](./tex.md) syntax and features, including the ability to reference units if
they know the label. However, comments have the following limitations:
- Declaring custom environments or macros will have no effect.
- Divisions and block environments will be numbered within the comment. 
- Divisions and block environments will not get their own pages. 
- Comments go through a profanity filter before being compiled. 

In addition, loading the website from the server (access using `localhost`) will allow deleting comments with a simple
button click on the bottom-right corner. 

Since only a light number of users are expected to post comments, **there are no significant security measures in the 
comment system, and adding them is not a priority of this project**. The current system has the following limitations:
- Lack of rate-limiting of comments. 
- Lack of limit on how many comments to fetch and display at a time. 

By default, the comment system is disabled. **Use it at your own risk**. 
