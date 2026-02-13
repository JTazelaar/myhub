from django.db import models

# Create your models here.
from django.db import models

class Task(models.Model):
    title = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    is_done = models.BooleanField(default=False)
    priority = models.IntegerField(default=3)  # 1 high, 5 low
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.title
