from uuid import UUID

from django.db import transaction
from django.utils import timezone

from plane.db.models import Profile, Project, State, User, Workspace, WorkspaceMember, WorkspaceUserProperties

LOCAL_USER_ID = UUID("00000000-0000-4000-8000-000000000001")
LOCAL_WORKSPACE_ID = UUID("00000000-0000-4000-8000-000000000002")


@transaction.atomic
def bootstrap_identity():
    user, created = User.objects.get_or_create(
        id=LOCAL_USER_ID,
        defaults={
            "username": "local",
            "email": "local@wplane.invalid",
            "display_name": "我",
            "first_name": "我",
            "user_timezone": "Asia/Shanghai",
            "is_email_verified": True,
        },
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])
    workspace, _ = Workspace.objects.get_or_create(
        id=LOCAL_WORKSPACE_ID,
        defaults={"name": "个人项目", "slug": "personal", "owner": user, "timezone": "Asia/Shanghai"},
    )
    WorkspaceMember.objects.get_or_create(workspace=workspace, member=user, defaults={"role": 20})
    WorkspaceUserProperties.objects.get_or_create(workspace=workspace, user=user)
    for project in Project.objects.filter(workspace=workspace):
        if not State.triage_objects.filter(project=project).exists():
            State.all_state_objects.create(
                project=project,
                workspace=workspace,
                group="triage",
                is_triage=True,
                name="待分拣",
                color="#4E5355",
                sequence=65000,
            )
    Profile.objects.get_or_create(
        user=user,
        defaults={
            "is_onboarded": True,
            "is_tour_completed": True,
            "is_navigation_tour_completed": True,
            "language": "zh-CN",
            "last_workspace_id": workspace.id,
        },
    )
    from plane.license.models import Instance, InstanceConfiguration

    Instance.objects.get_or_create(
        instance_id="wplane-personal",
        defaults={
            "instance_name": "个人项目管理",
            "current_version": "1.5.0-personal",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
            "is_telemetry_enabled": False,
            "is_support_required": False,
        },
    )
    for key, value in {
        "ENABLE_SIGNUP": "0",
        "DISABLE_WORKSPACE_CREATION": "1",
        "ENABLE_MAGIC_LINK_LOGIN": "0",
        "ENABLE_EMAIL_PASSWORD": "0",
        "IS_GOOGLE_ENABLED": "0",
        "IS_GITHUB_ENABLED": "0",
        "IS_GITLAB_ENABLED": "0",
        "IS_GITEA_ENABLED": "0",
    }.items():
        InstanceConfiguration.objects.get_or_create(key=key, defaults={"value": value, "category": "PERSONAL"})
    return user, workspace
