from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='PersonalSetting',
            fields=[
                ('key', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('value', models.JSONField(default=dict)),
            ],
        ),
        migrations.CreateModel(
            name='LegacyRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_table', models.CharField(max_length=64)),
                ('source_id', models.CharField(max_length=100)),
                ('payload', models.JSONField()),
            ],
            options={
                'constraints': [models.UniqueConstraint(fields=('source_table', 'source_id'), name='personal_legacy_unique')],
            },
        ),
    ]
