from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "is_done", "priority", "due_date", "updated_at")
    list_filter = ("is_done",)
    search_fields = ("title", "notes")
    ordering = ("is_done", "priority", "due_date", "-updated_at")
