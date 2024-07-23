import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator

from .models import User, Post, Like, Follower


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def posts(request, page):
    if request.method == "POST":
        data = json.loads(request.body)
        content = data.get("content")
        post = Post(poster=request.user, content=content)
        post.save()
        return JsonResponse({"message": "Post written successfully."}, status=201)

    elif request.method == "GET":
        posts = Post.objects.all()
        posts = posts.order_by("-datetime").all()
        p = Paginator(posts, 10)
        response_data = {
                "posts": [post.serialize() for post in p.page(page).object_list],
                "request_user": request.user.username,
                "num_pages": p.num_pages
            }
        return JsonResponse(response_data, safe=False)
    
@csrf_exempt
@login_required
def profile(request, username, page):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    
    themself = (request.user.username == username)
    unfollow = Follower.objects.filter(user=request.user, following=user).exists()
    followers = Follower.objects.filter(following=user).count()
    following = Follower.objects.filter(user=user).count()
    
    if request.method == "GET":
        posts = Post.objects.filter(poster=user)
        posts = posts.order_by("-datetime").all()
        p = Paginator(posts, 10)
        posts = [post.serialize() for post in p.page(page).object_list]
        return JsonResponse({
            "username": username,
            "followers": followers,
            "following": following,
            "posts": posts,
            "themself": themself,
            "unfollow": unfollow,
            "request_user": request.user.username,
            "num_pages": p.num_pages
        })
    
    elif request.method == "PUT":
        data =json.loads(request.body)
        if data.get("unfollow") is not None:
            if data.get("unfollow"):
                Follower.objects.filter(user=request.user, following=user).delete()
            else:
                follower = Follower(user=request.user, following=user)
                follower.save()
        return HttpResponse(status=204)
    
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status = 400)
    
@csrf_exempt
@login_required
def following(request, page):
    if request.method == "GET":
        following = Follower.objects.filter(user=request.user).values_list('following', flat=True)
        posts = Post.objects.filter(poster__in=following).order_by("-datetime").all()
        p = Paginator(posts, 10)
        response_data = {
                "posts": [post.serialize() for post in p.page(page).object_list],
                "request_user": request.user.username,
                "num_pages": p.num_pages
            }
        return JsonResponse(response_data, safe=False)
    
@csrf_exempt
@login_required
def post(request, post_id):
    post = Post.objects.get(id=post_id)
    if request.method == "GET":
        liked = Like.objects.filter(user=request.user, post=post).exists()
        likes = Like.objects.filter(post=post).count()
        return JsonResponse({
            "liked": liked,
            "likes": likes
        })
    
    if request.method == "PUT":
        data = json.loads(request.body)
        if data.get("content") is not None:
            if request.user == post.poster:
                if data.get("content") is not None:
                    post.content = data.get("content")
                    post.save()
                return HttpResponse(status=204)
            else:
                return JsonResponse({
                    "error": "It is not possible for a user to edit another user's posts."
                }, status = 400)
        elif data.get("like") is not None:
            if data.get("like"):
                like = Like(user=request.user, post=post)
                like.save()
                post.likes = Like.objects.filter(post=post).count()
                post.save()
            else:
                like = Like.objects.get(user=request.user, post=post)
                like.delete()
                post.likes = Like.objects.filter(post=post).count()
                post.save()
            return HttpResponse(status=204)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status = 400)
            