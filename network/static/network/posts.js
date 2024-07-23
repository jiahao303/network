document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all-posts').addEventListener('click', () => all_posts(1));
    document.querySelector('#profile-page').addEventListener('click', () => profile_page(document.querySelector('#profile-page').innerText, 1));
    document.querySelector('#following').addEventListener('click', () => following(1));

    all_posts(1);
    
});

function all_posts(page) {
    // Show All Posts view and hide other views
    document.querySelector('#all-posts-view').style.display = 'block';
    document.querySelector('#profile-page-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';

    document.querySelector('#all-posts-view').innerHTML = '<h2 class="my-2">All Posts</h2><div class="card mb-2"><div class="card-body"><h5 class="card-title">New Post</h5><form id="new-post-form"><textarea class="form-control mb-1" id="compose-content"></textarea><input type="submit" class="btn btn-primary" value="Post"/></form></div></div>';

    // Clear out composition fields
    document.querySelector('#compose-content').value = '';

    // New Post
    document.querySelector('#new-post-form').onsubmit = () => {
        fetch('/posts/0', {
            method: 'POST',
            body: JSON.stringify({
                content: document.querySelector('#compose-content').value
            })
        })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
        })
        all_posts(1);
        return false;
    }

    fetch('/posts/' + page)
    .then(response => response.json())
    .then(data => {
        //Print posts
        console.log(data);
        data.posts.forEach(post => {
            const element = document.createElement('div');
            element.id = 'post';
            let post_card = '<div class="card mb-2"> <div class="card-body"> <div id="username"> <h5 class="card-title">' + post.poster + '</h5> </div>';
            if (data.request_user == post.poster) {
                post_card += '<div><a id="edit" href="" onclick="return false;">Edit</a></div>';
            }
            post_card += '<p class="card-text" id="content">' + post.content + '</p> <p class="card-text text-muted">' + post.datetime + '</p> <button id="like">❤️</button> <span class="card-text text muted" id="likes">' + post.likes + '</span> </div> </div>';
            element.innerHTML = post_card;
            document.querySelector('#all-posts-view').append(element);
            const username = element.querySelector('#username');
            username.onclick = () => {
                profile_page(username.querySelector('.card-title').innerHTML, 1)
            }

            //Edit Post
            if (data.request_user == post.poster) {
                const edit = element.querySelector('#edit');
                edit.addEventListener('click', () => {
                    if (element.querySelector('#content')) {
                        post_content = element.querySelector('#content').innerHTML;
                        const form = document.createElement('form');
                        form.id = 'edit-post-form';
                        const textarea = document.createElement('textarea');
                        textarea.classList.add('form-control');
                        textarea.id = 'edit-content';
                        const content = element.querySelector("#content");
                        textarea.value = content.innerHTML;
                        const save = document.createElement('input');
                        save.type = 'submit';
                        save.classList.add('btn', 'btn-primary');
                        save.value = "Save";
                        form.appendChild(textarea);
                        form.appendChild(save);
                        content.parentNode.replaceChild(form, content);
                        document.querySelector('#edit-post-form').addEventListener('submit', function(event) {
                            event.preventDefault();
                            edit_content = document.querySelector('#edit-content').value
                            fetch('/post/' + post.id, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    content: edit_content
                                })
                            })
                            const form = document.querySelector('#edit-post-form');
                            const content = document.createElement('p');
                            content.id = 'content';
                            content.className = 'card-text';
                            content.textContent = edit_content;
                            form.parentNode.replaceChild(content, form);
                        });
                    } else {
                        const form = document.querySelector('#edit-post-form');
                        const content = document.createElement('p');
                        content.id = 'content';
                        content.className = 'card-text';
                        content.textContent = post_content;
                        form.parentNode.replaceChild(content, form);
                    }
                });
            }

            // Like and Unlike
            const like = element.querySelector('#like');
            const likes = element.querySelector('#likes');
            like.addEventListener('click', () => {
                fetch('/post/' + post.id)
                .then(response => response.json())
                .then(data => {
                    if (data.liked) {
                        fetch('/post/' + post.id, {
                            method: 'PUT',
                            body: JSON.stringify({
                                like: false
                            })
                        })
                    likes.textContent = data.likes - 1;
                    } else {
                        fetch('/post/' + post.id, {
                            method: 'PUT',
                            body: JSON.stringify({
                                like: true
                            })
                        })
                    likes.textContent = data.likes + 1;
                    }
                })
            })
        });

        // Pagination
        if (data.num_pages > 1) {
            const element = document.createElement('div');
            let page_items = "";
            if (page != 1) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="all_posts(' + String(page - 1) + ')">Previous</a></li>';
            }
            for (let i = 1; i <= data.num_pages; i++) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="all_posts(' + String(i) + ')">' + String(i) + '</a></li>';
            }
            if (page != data.num_pages) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="all_posts(' + String(page + 1) + ')">Next</a></li>';
            }
            element.innerHTML = '<nav aria-label="Page navigation"><ul class="pagination">' + page_items + '</ul></nav>';
            document.querySelector('#all-posts-view').append(element);
        }
    });
}

function profile_page(user, page) {
     // Show Profile Page view and hide other views
     document.querySelector('#all-posts-view').style.display = 'none';
     document.querySelector('#profile-page-view').style.display = 'block';
     document.querySelector('#following-view').style.display = 'none';

     document.querySelector('#profile-page-view').innerHTML = '';
     
     fetch('/profile/' + user.trim() + '/' + page)
     .then(response => response.json())
     .then(data => {
        const element = document.createElement('div');
        if (data.themself) {
            element.innerHTML = '<div class="card mb-2"> <div class="card-body"> <div class="username"> <h5 class="card-title">' + data.username + '</h5> </div> <p class="card-text"><strong id="followers">' + data.followers + '</strong> Followers&emsp;<strong id="following">' + data.following + '</strong> Following';
        } else {
            if (data.unfollow) {
                element.innerHTML = '<div class="card mb-2"> <div class="card-body"> <div class="username"> <h5 class="card-title">' + data.username + '<button class="btn btn-sm btn-outline-primary ml-3" id="unfollow">Unfollow</button></h5> </div> <p class="card-text"><strong id="followers">' + data.followers + '</strong> Followers&emsp;<strong id="following">' + data.following + '</strong> Following';
            } else {
                element.innerHTML = '<div class="card mb-2"> <div class="card-body"> <div class="username"> <h5 class="card-title">' + data.username + '<button class="btn btn-sm btn-outline-primary ml-3" id="follow">Follow</button></h5> </div> <p class="card-text"><strong id="followers">' + data.followers + '</strong> Followers&emsp;<strong id="following">' + data.following + '</strong> Following';
            }
        }
        document.querySelector('#profile-page-view').append(element);
        if (!data.themself) {
            if (data.unfollow) {
                document.querySelector('#unfollow').addEventListener('click', () => {
                    document.querySelector('#unfollow').id = 'follow';
                    document.querySelector('#follow').innerText = 'Follow';
                    fetch('/profile/' + user.trim() + '/0', {
                        method: 'PUT',
                        body: JSON.stringify({
                            unfollow: true
                        })
                    })
                    profile_page(user, page);
                    return false;
                });
            } else {
                document.querySelector('#follow').addEventListener('click', () => {
                    document.querySelector('#follow').id = 'unfollow';
                    document.querySelector('#unfollow').innerText = 'Unfollow'
                    fetch('/profile/' + user.trim() + '/0', {
                        method: 'PUT',
                        body: JSON.stringify({
                            unfollow: false
                        })
                    })
                    profile_page(user, page);
                    return false;
                });
            }
        }

        data.posts.forEach(post => {
            console.log(post);
            const element = document.createElement('div');
            element.id = 'post';
            let post_card = '<div class="card mb-2"> <div class="card-body"> <div id="username"> <h5 class="card-title">' + post.poster + '</h5> </div>';
            if (data.request_user == post.poster) {
                post_card += '<div><a id="edit" href="" onclick="return false;">Edit</a></div>';
            }
            post_card += '<p class="card-text" id="content">' + post.content + '</p> <p class="card-text text-muted">' + post.datetime + '</p> <button id="like">❤️</button> <span class="card-text text muted" id="likes">' + post.likes + '</span> </div> </div>';
            element.innerHTML = post_card;
            document.querySelector('#profile-page-view').append(element);
            const username = element.querySelector('#username');
            username.onclick = () => {
                profile_page(username.querySelector('.card-title').innerHTML, 1)
            }

            //Edit Post
            if (data.request_user == post.poster) {
                const edit = element.querySelector('#edit');
                edit.addEventListener('click', () => {
                    if (element.querySelector('#content')) {
                        post_content = element.querySelector('#content').innerHTML;
                        const form = document.createElement('form');
                        form.id = 'edit-post-form';
                        const textarea = document.createElement('textarea');
                        textarea.classList.add('form-control');
                        textarea.id = 'edit-content';
                        const content = element.querySelector("#content");
                        textarea.value = content.innerHTML;
                        const save = document.createElement('input');
                        save.type = 'submit';
                        save.classList.add('btn', 'btn-primary');
                        save.value = "Save";
                        form.appendChild(textarea);
                        form.appendChild(save);
                        content.parentNode.replaceChild(form, content);
                        document.querySelector('#edit-post-form').addEventListener('submit', function(event) {
                            event.preventDefault();
                            edit_content = document.querySelector('#edit-content').value
                            fetch('/post/' + post.id , {
                                method: 'PUT',
                                body: JSON.stringify({
                                    content: edit_content
                                })
                            })
                            const form = document.querySelector('#edit-post-form');
                            const content = document.createElement('p');
                            content.id = 'content';
                            content.className = 'card-text';
                            content.textContent = edit_content;
                            form.parentNode.replaceChild(content, form);
                        });
                    } else {
                        const form = document.querySelector('#edit-post-form');
                        const content = document.createElement('p');
                        content.id = 'content';
                        content.className = 'card-text';
                        content.textContent = post_content;
                        form.parentNode.replaceChild(content, form);
                    }
                });
            }

            // Like and Unlike
            const like = element.querySelector('#like');
            const likes = element.querySelector('#likes');
            like.addEventListener('click', () => {
                fetch('/post/' + post.id)
                .then(response => response.json())
                .then(data => {
                    if (data.liked) {
                        fetch('/post/' + post.id, {
                            method: 'PUT',
                            body: JSON.stringify({
                                like: false
                            })
                        })
                    likes.textContent = data.likes - 1;
                    } else {
                        fetch('/post/' + post.id, {
                            method: 'PUT',
                            body: JSON.stringify({
                                like: true
                            })
                        })
                    likes.textContent = data.likes + 1;
                    }
                })
            })
        });

        // Pagination
        if (data.num_pages > 1) {
            const element = document.createElement('div');
            let page_items = "";
            if (page != 1) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="profile_page(\'' + String(user) + '\',' + String(page - 1) + ')">Previous</a></li>';
            }
            for (let i = 1; i <= data.num_pages; i++) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="profile_page(\'' + String(user) + '\',' + String(i) + ')">' + String(i) + '</a></li>';
            }
            if (page != data.num_pages) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="profile_page(\'' + String(user) + '\',' + String(page + 1) + ')">Next</a></li>';
            }
            element.innerHTML = '<nav aria-label="Page navigation"><ul class="pagination">' + page_items + '</ul></nav>';
            document.querySelector('#profile-page-view').append(element);
        }
     })
}

function following(page) {
    // Show Following view and hide other views
    document.querySelector('#all-posts-view').style.display = 'none';
    document.querySelector('#profile-page-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'block';

    document.querySelector('#following-view').innerHTML = '<h2 class="my-2">Following</h2>';

    fetch('/following/' + page)
    .then(response => response.json())
    .then(data => {
        data.posts.forEach(post => {
            const element = document.createElement('div');
            element.id = 'post';
            let post_card = '<div class="card mb-2"> <div class="card-body"> <div id="username"> <h5 class="card-title">' + post.poster + '</h5> </div>';
            if (data.request_user == post.poster) {
                post_card += '<div><a id="edit" href="" onclick="return false;">Edit</a></div>';
            }
            post_card += '<p class="card-text" id="content">' + post.content + '</p> <p class="card-text text-muted">' + post.datetime + '</p> <button id="like">❤️</button> <span class="card-text text muted" id="likes">' + post.likes + '</span> </div> </div>';
            element.innerHTML = post_card;
            document.querySelector('#following-view').append(element);
            const username = element.querySelector('#username');
            username.onclick = () => {
                profile_page(username.querySelector('.card-title').innerHTML, 1)
            }

            // Like and Unlike
            const like = element.querySelector('#like');
            const likes = element.querySelector('#likes');
            like.addEventListener('click', () => {
            fetch('/post/' + post.id)
            .then(response => response.json())
            .then(data => {
                if (data.liked) {
                    fetch('/post/' + post.id, {
                        method: 'PUT',
                        body: JSON.stringify({
                            like: false
                        })
                    })
                    likes.textContent = data.likes - 1;
                } else {
                    fetch('/post/' + post.id, {
                        method: 'PUT',
                        body: JSON.stringify({
                            like: true
                        })
                    })
                    likes.textContent = data.likes + 1;
                }
            })
        })
    })
        
        // Pagination
        if (data.num_pages > 1) {
            const element = document.createElement('div');
            let page_items = "";
            if (page != 1) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="following(' + String(page - 1) + ')">Previous</a></li>';
            }
            for (let i = 1; i <= data.num_pages; i++) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="following(' + String(i) + ')">' + String(i) + '</a></li>';
            }
            if (page != data.num_pages) {
                page_items += '<li class="page-item"><a class="page-link" href="#" onclick="following(' + String(page + 1) + ')">Next</a></li>';
            }
            element.innerHTML = '<nav aria-label="Page navigation"><ul class="pagination">' + page_items + '</ul></nav>';
            document.querySelector('#following-view').append(element);
        }
    });
}