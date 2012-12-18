# 开发规范

下面是一些随手记下来的东西，欢迎修修补补

  * 多写注释
  * 所有内部实现的回调，其返回值都采用next`( err, data )`这样的方式，传值的时候只要把next传递过去就行了，比如:
  ```js

  function async( next ){
    var query = { name: 'neekey' };
    queryDB( query, next );
  });
  ```