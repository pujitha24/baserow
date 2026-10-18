import pytest

from baserow.contrib.database.rows.handler import RowHandler
from baserow.core.notifications.models import NotificationRecipient
from baserow_enterprise.role.handler import RoleAssignmentHandler
from baserow_enterprise.role.models import Role


@pytest.mark.django_db(transaction=True)
def test_collaborator_notification_not_sent_to_users_without_table_access(
    data_fixture, enable_enterprise, synced_roles
):
    admin = data_fixture.create_user()
    allowed = data_fixture.create_user()
    denied = data_fixture.create_user()
    workspace = data_fixture.create_workspace(user=admin, members=[allowed, denied])
    database = data_fixture.create_database_application(workspace=workspace)
    table = data_fixture.create_database_table(database=database)
    field = data_fixture.create_multiple_collaborators_field(
        user=admin, table=table, notify_user_when_added=True
    )
    RoleAssignmentHandler().assign_role(
        allowed, workspace, role=Role.objects.get(uid="EDITOR")
    )
    RoleAssignmentHandler().assign_role(
        denied, workspace, role=Role.objects.get(uid="NO_ACCESS")
    )

    RowHandler().create_row(
        user=admin,
        table=table,
        values={field.db_column: [{"id": allowed.id}, {"id": denied.id}]},
    )

    recipients = NotificationRecipient.objects.values_list("recipient_id", flat=True)
    assert list(recipients) == [allowed.id]
