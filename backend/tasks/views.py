from django.shortcuts import render, redirect
from .models import Task
from django.shortcuts import get_object_or_404

def dashboard(request):
    if not request.user.is_authenticated:
        return redirect("/admin/login/?next=/")

    if request.method == "POST":
        title = request.POST.get("title")
        priority = request.POST.get("priority", 3)
        if title:
            Task.objects.create(title=title, priority=priority)

    open_tasks = Task.objects.filter(is_done=False).order_by("priority", "due_date")
    done_tasks = Task.objects.filter(is_done=True).order_by("-updated_at")[:10]

    return render(
        request,
        "tasks/dashboard.html",
        {
            "open_tasks": open_tasks,
            "done_tasks": done_tasks,
        },
    )

def toggle_task_done(request, task_id: int):
    if not request.user.is_authenticated:
        return redirect("/admin/login/?next=/")

    task = get_object_or_404(Task, id=task_id)
    task.is_done = not task.is_done
    task.save(update_fields=["is_done", "updated_at"])
    return redirect("/")
