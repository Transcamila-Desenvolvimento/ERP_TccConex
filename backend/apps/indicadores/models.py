from django.db import models


class IndicadorKpi(models.Model):
    label = models.CharField(max_length=100)
    value = models.CharField(max_length=50)
    change = models.CharField(max_length=20)
    up = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.label


class IndicadorFilial(models.Model):
    filial = models.CharField(max_length=100)
    receita = models.CharField(max_length=50)
    fretes = models.PositiveIntegerField()
    toneladas = models.CharField(max_length=20)
    meta = models.CharField(max_length=20)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.filial
