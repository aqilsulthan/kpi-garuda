--
-- PostgreSQL database dump
--

\restrict ihD18VGLbYYoIAlhcNgQla4F9cZeOePwF6RC13DLvvE7l3V2MiDwIrmjrZEPDP4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: analysis_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(20) NOT NULL,
    dept_id uuid,
    period character varying(7) NOT NULL,
    ai_content text,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_by uuid,
    approved_by uuid,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT analysis_drafts_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'approved'::character varying, 'published'::character varying])::text[])))
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level character varying(5) NOT NULL,
    name character varying(255) NOT NULL,
    head_position character varying(255),
    unit_name character varying(255),
    parent_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT departments_level_check CHECK (((level)::text = ANY ((ARRAY['L1'::character varying, 'L2'::character varying, 'L3'::character varying])::text[])))
);


--
-- Name: external_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    period character varying(7) NOT NULL,
    data_type character varying(50) NOT NULL,
    value numeric NOT NULL,
    unit character varying(50),
    notes text,
    source character varying(50) DEFAULT 'manual'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: kpi_actuals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_actuals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kpi_item_id uuid NOT NULL,
    actual_value numeric NOT NULL,
    period character varying(7) NOT NULL,
    source character varying(20) DEFAULT 'manual_input'::character varying,
    input_by uuid,
    input_at timestamp without time zone DEFAULT now(),
    CONSTRAINT kpi_actuals_source_check CHECK (((source)::text = ANY ((ARRAY['excel_import'::character varying, 'manual_input'::character varying])::text[])))
);


--
-- Name: kpi_dictionary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_dictionary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action_verb character varying(255) NOT NULL,
    definition text,
    formula_description text,
    data_source character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: kpi_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(20) NOT NULL,
    dept_id uuid,
    period character varying(7) NOT NULL,
    no integer NOT NULL,
    objective text NOT NULL,
    action_verb character varying(255) NOT NULL,
    target_from numeric NOT NULL,
    target_to numeric NOT NULL,
    parameter character varying(100),
    bobot numeric NOT NULL,
    polaritas character varying(5) NOT NULL,
    cascaded_from character varying(255),
    key_drivers text,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT kpi_items_bobot_check CHECK (((bobot > (0)::numeric) AND (bobot <= (1)::numeric))),
    CONSTRAINT kpi_items_entity_type_check CHECK (((entity_type)::text = ANY ((ARRAY['corporate'::character varying, 'department'::character varying, 'unit'::character varying])::text[]))),
    CONSTRAINT kpi_items_polaritas_check CHECK (((polaritas)::text = ANY ((ARRAY['Max'::character varying, 'Min'::character varying])::text[])))
);


--
-- Name: upload_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upload_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    filename character varying(255) NOT NULL,
    entity_type character varying(20),
    dept_id uuid,
    period character varying(7),
    items_parsed integer DEFAULT 0,
    actuals_parsed integer DEFAULT 0,
    status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    uploaded_by uuid,
    uploaded_at timestamp without time zone DEFAULT now(),
    CONSTRAINT upload_logs_status_check CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'partial'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'corporate_planning'::character varying, 'direksi'::character varying])::text[])))
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: analysis_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analysis_drafts (id, entity_type, dept_id, period, ai_content, status, created_by, approved_by, published_at, created_at, updated_at) FROM stdin;
cb7c67db-e990-4f52-b0e7-d0ae142cca00	corporate	00000000-0000-0000-0000-000000000001	2025-12	### Executive Summary\n\n#### 1. **Ringkasan Performa**\nTotal score keseluruhan: 0.751528523468421 (Grade: 🟡)\n\n#### 2. **KPI Kritis**\n- **Safety & Airworthiness Excellence Index**: 87.48% (ach_rate: 87.48%, Grade: 🟡)\n  - *Dampak*: Kegagalan dalam kelaikan udara dan keselamatan fisik dapat mengancam operasional maskapai.\n- **On-Time Performance (OTP) & Ops Reliability**: 79.52% (ach_rate: 83.71%, Grade: 🔴)\n  - *Dampak*: Penurunan keandalan jadwal penerbangan dapat menurunkan kepuasan penumpang dan reputasi maskapai.\n- **Cost Leadership & CASK Optimization**: 83.10% (ach_rate: 84.79%, Grade: 🟡)\n  - *Dampak*: Efisiensi biaya yang kurang optimal dapat mempengaruhi daya saing harga tiket.\n- **Financial Strategy & Liquidity Resilience**: 80.50% (ach_rate: 84.74%, Grade: 🟡)\n  - *Dampak*: Ketahanan kas yang kurang dapat meningkatkan risiko finansial.\n- **Digital Transformation & SAP Integration**: 75.20% (ach_rate: 75.20%, Grade: 🟡)\n  - *Dampak*: Modernisasi sistem yang belum selesai dapat menghambat efisiensi proses.\n- **Commercial Growth & Ancillary Revenue**: 68.90% (ach_rate: 72.53%, Grade: 🔴)\n  - *Dampak*: Pendapatan langsung dan ancillary yang rendah dapat mengurangi profitabilitas.\n- **Cybersecurity & Data Privacy Maturity**: 77.40% (ach_rate: 78.98%, Grade: 🟡)\n  - *Dampak*: Perlindungan aset digital yang kurang dapat meningkatkan risiko serangan siber.\n\n#### 3. **Highlight Positif**\n- **Corporate Governance & Legal Compliance**: 91.20% (ach_rate: 91.20%, Grade: 🟢)\n  - *Dampak*: Menjamin tata kelola, legalitas, dan kepatuhan pajak, menghindari denda regulasi dan menjaga reputasi di mata investor.\n\n#### 4. **3 Rekomendasi Utama**\n1. **Peningkatan Keandalan Operasional**:\n   - *Action*: Fokus pada pengurangan technical delay dan peningkatan efisiensi pengadaan.\n   - *Timeline*: Q1 2026\n2. **Optimasi Biaya dan Efisiensi Sumber Daya**:\n   - *Action*: Implementasi kontrol overtime SDM dan efisiensi biaya maintenance.\n   - *Timeline*: Q2 2026\n3. **Akselerasi Digital Transformation**:\n   - *Action*: Penyelesaian modul SAP (Fin/HCM), e-Logbook, dan modernisasi armada.\n   - *Timeline*: Q3 2026\n\nDengan fokus pada rekomendasi ini, diharapkan performa maskapai dapat ditingkatkan secara signifikan.	published	6f15f112-aeee-4928-bc3f-1d19be87cae4	\N	2026-03-07 15:48:10.602	2026-03-07 15:41:50.694447	2026-03-07 15:48:11.69535
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, level, name, head_position, unit_name, parent_id, created_at) FROM stdin;
00000000-0000-0000-0000-000000000001	L1	Corporate	Chief Executive Officer (CEO)	\N	\N	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000002	L2	Engineering	Director of Engineering	\N	00000000-0000-0000-0000-000000000001	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000003	L2	Finance	Director of Finance	\N	00000000-0000-0000-0000-000000000001	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000004	L2	Human Resource	Director of Human Resource	\N	00000000-0000-0000-0000-000000000001	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000005	L2	IT	Chief Information Officer (CIO)	\N	00000000-0000-0000-0000-000000000001	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000010	L3	Engineering	VP Maintenance & Utility	Unit Maintenance & Utility	00000000-0000-0000-0000-000000000002	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000011	L3	Engineering	VP Project Management	Unit Project Management	00000000-0000-0000-0000-000000000002	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000012	L3	Engineering	VP Quality Assurance	Unit Quality Assurance	00000000-0000-0000-0000-000000000002	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000020	L3	Finance	VP Procurement	Unit Procurement	00000000-0000-0000-0000-000000000003	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000021	L3	Finance	VP Tax & Accounting	Unit Tax & Accounting	00000000-0000-0000-0000-000000000003	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000022	L3	Finance	VP Treasury & Cash Flow	Unit Treasury & Cash Flow	00000000-0000-0000-0000-000000000003	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000030	L3	Human Resource	VP Learning & Development	Unit Learning & Development	00000000-0000-0000-0000-000000000004	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000031	L3	Human Resource	VP Payroll & Benefit	Unit Payroll & Benefit	00000000-0000-0000-0000-000000000004	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000032	L3	Human Resource	VP Recruitment	Unit Recruitment	00000000-0000-0000-0000-000000000004	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000040	L3	IT	VP Infrastructure & Security	Unit Infrastructure & Security	00000000-0000-0000-0000-000000000005	2026-03-07 04:36:56.461212
00000000-0000-0000-0000-000000000042	L3	IT	VP Software Development	Unit Software Development	00000000-0000-0000-0000-000000000005	2026-03-10 01:09:10.175375
00000000-0000-0000-0000-000000000043	L3	IT	VP Support & Helpdesk	Unit Support & Helpdesk	00000000-0000-0000-0000-000000000005	2026-03-10 01:09:10.175375
\.


--
-- Data for Name: external_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_data (id, period, data_type, value, unit, notes, source, created_by, created_at) FROM stdin;
298d1a26-26cb-4fa7-8b8c-ec13c6c2bb73	2025-12	kurs_usd_idr	16973	IDR/USD	Otomatis ditarik pada 2026-03-06 (Latest Rate)	api_frankfurter	4120a306-a706-470d-8320-f0e0006732dd	2026-03-09 02:12:49.495759
4b68aec7-14bc-4e51-8639-7f8a72a4710f	2025-12	crude_oil	70.89	$/BBL	Ditarik otomatis (Periode Harga EIA: 2026-02)	api_eia	4120a306-a706-470d-8320-f0e0006732dd	2026-03-09 02:12:49.495759
67a9e1d1-146f-4266-8e01-d73063dcd442	2025-12	inflation	2.75	% (YoY)	Konektor BPS Aktif - Ditarik via API	api_bps	4120a306-a706-470d-8320-f0e0006732dd	2026-03-09 02:12:49.495759
\.


--
-- Data for Name: kpi_actuals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_actuals (id, kpi_item_id, actual_value, period, source, input_by, input_at) FROM stdin;
a82d8f42-7e25-4a28-9e5f-2178e55ae2a4	13b6968a-ce49-49e8-8308-825a6ba6fa98	85.96	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
f9648226-f9e2-49d6-af65-76addcb3c67e	6e1b40de-17ed-4e5e-8a59-e04d52d36f73	99	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
5c43b590-10dc-49db-8326-02fbef4bb133	928aa65c-3169-4d6b-b118-f048a743d6bd	2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
b1a5c691-fed6-4bbf-8417-eedf1845bd40	f4812eea-56a2-49dc-bb3b-8ac37b83af9c	78.5	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
9a23edcf-dd4a-4d6e-a8f1-74d4b3e3aa0f	cfb7e3c7-7e8b-43c3-a520-f3e659d1834a	90.2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
cdd1a153-5611-46bf-a657-9b63f1c260dd	b87ee64f-bf3c-4696-bd9c-f44234b4c172	82.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
4fdc79a0-4f2c-43b2-980f-7135c4adc675	e81558a0-0af2-4121-89d4-0980f9dc7002	4.37	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
79bbbb60-7a9c-45df-bb3f-cb831c821dec	ade47d1c-067a-4b64-bd57-7f24383e50de	98.82	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
b6908366-c9fa-47f7-a1b5-5e627a04d334	2dc5442e-de00-4b3e-a62d-6ea191a339d8	44.83	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
435a2a5e-5a4c-48d8-bb8d-10888b4e90e3	0eda0474-fcf7-4bdc-b77b-9d3244355dfa	96.5	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
61fdd7dd-3320-453f-865d-2898e24a36be	5689f054-0f9e-4f79-bf15-b47d36d1963d	82.3	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
202f6341-326f-4cef-979b-0d7cc1e45afb	863e0ce4-bb8e-41ba-bba3-86fa5a9737f5	78.9	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
df6f2a98-3912-4d7e-a47f-e1579e103c0b	a7618a87-c2a6-4766-a38b-1937c8424e70	99.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
f39ee58c-cdab-4fed-beda-24600728376a	54817013-81df-48fc-9ede-3547314144e4	4.2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
4433ea08-7387-4192-8916-aff8488731ec	628cd574-f1a0-482a-ae6d-5d6ca567fe9d	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
fe3ac236-88d2-41a6-84ed-9cb924178989	967075a2-4c71-4e00-aa86-87060ce3db5a	80.55	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
8f01eb5f-7319-4bc4-9f05-8c3eba530090	44af8ebb-2257-445e-bdce-2b8a4fb5df3c	82.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
fd4c001d-ff83-44b2-be19-7c0a63731f70	e8768b43-b0f0-4cc5-8121-a3a2886345cd	4	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
b20fd7ff-2b33-47dc-89f5-5698c65dd95e	f337f458-ddf1-4f17-af53-10bffb96212b	12	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
f737bc60-2823-4fc4-ad09-0d0d2021012e	61b66c49-238d-4bd9-bb56-c59137be1c75	78	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
28d71bff-d70a-404a-ac4f-dd40d866a2a3	a57aac4c-cf65-4289-ab7f-8b4414d0a907	1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
8626cbd9-da32-4ffb-b4f2-c260279713d9	94160e30-16a4-48de-9067-d8f516193cf5	7.8	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
a9652c36-f815-4ea4-a6b6-ff9d7a0891f1	314c1b46-c0b4-4f72-89a6-1beff95f456c	58.47	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
be60d720-edb8-44e3-b00e-6ea120e2fe8e	b4343399-9005-48a1-be96-a8731d1d966c	89.5	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
a3e0aa9b-3fa4-49c7-af9d-2b6d9cc90baf	17507025-8268-40a6-b145-5380098809e4	72	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
25b092ee-d83b-4b6e-94f4-d00b5bf05037	c89760b7-9355-46ef-a907-af009b0da930	79.8	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
3c1f18af-8b1d-4095-85ee-95d80551eb4f	5bd9c989-adef-4fa4-8bf5-212c011a56b0	76.3	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
4891512f-64a9-44f4-840b-cad3c67b2e4a	18799fce-2c4e-45cf-b4ad-9d77d88c71e8	94.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
d3206133-8731-448b-8b17-b7d6e0d28a58	1bd51b02-e74a-4d64-9eb0-389af95bcd9a	74.4	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:22.224591
2909334e-8c59-4191-96da-9b0c396f1c7c	b0496787-bad7-459f-991a-cde80248ef2e	13.3	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:22.224591
5ea2dffd-db2c-4fe9-9b0e-5535f64fef99	205e2606-097b-415e-ba74-aaf1b28c76f2	71.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:22.224591
3d865442-3388-49ca-9813-1bab4c14ccbf	5abcae28-f8b5-48fa-8191-3d01685c3fcc	72	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:22.224591
397fad29-16c0-4229-8f67-c8c4cbabccd2	bd3f0aa1-a406-4eaa-bcd8-aa774bf6ac04	91	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:22.224591
a7ed4245-4192-44e9-8df8-aecf19d82e5b	0edca355-3929-4ef7-b930-4269c7eb91d4	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:33.176313
930e80bb-58c8-45d7-aa91-cd2f92741187	be78b58b-1333-4fdb-b551-9fd5d727b78c	38.5	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:33.176313
26133657-5e08-4e3f-8393-81d0b53905fe	83c08733-eb5d-4153-91ad-9f61d5a12d2f	1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:33.176313
76da7a3a-cef0-4540-a4b7-05a2b0e61ee5	d7720037-2a79-4f0f-9e04-d3e5d691f64a	97.9	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:33.176313
c55df74e-b7ce-4e74-8428-c3b9e39d0bf0	b68fbf27-c583-4288-912d-5f5f1f058bd5	0	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:33.176313
bae5a618-4161-449d-95e6-4f7f3b7e5199	73aea8ff-17bf-42a1-b721-85477d02d644	9.23	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:50.624351
e19ea3fc-66c0-459f-80bb-a5ba77b7f51f	5a105ffd-9efd-40fa-92d3-3dffbc310143	10.2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:50.624351
c7eb087a-4d13-4780-8031-8dbcb2007e39	42ace29e-151a-4bdc-adf6-17f8713b8731	90.3	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:50.624351
69532f9c-0f3b-478e-8e74-a8932b74f995	001a061f-6b32-4985-9f85-4a76124f4b71	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:50.624351
c6a454ea-d165-4630-83f1-467204761c99	2b199d34-1199-4a7c-9612-561ef6df1683	97.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:50.624351
48467b74-2f8a-4798-9636-b417a048903f	f9598cae-328d-4e52-adf1-4742ad14f1c6	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:26.328769
95cf7865-765f-4a18-a067-d812c9dba1f5	6739a613-9508-4537-8998-a8337d2a124f	82	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:26.328769
fe213859-e32a-4da3-8408-2ac6cd8b8ef9	7db0a47d-40cf-4007-8efe-49923919a7ff	89.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:26.328769
dab239d9-ce29-48a0-a7bc-32e2047a9c99	0482f029-c51c-46b7-884a-003584635b9f	32.7	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:26.328769
c9ad50e8-487f-42ef-9634-669b4e447646	ca0fb778-06cc-4e4f-93a5-f4879e4aaa92	355	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:26.328769
1d87ad88-2af4-4a20-9434-22b221006e33	6a0cbe7a-c230-4437-ba84-214dcada6063	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:23.543182
9d732d81-f823-4ec2-a246-c0f94d096b43	3ba77b89-e3b6-4c87-9e45-0eef1ef1bb08	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:23.543182
2e4e12f5-03af-4d83-8406-eb7bec583b12	1a8f2cf0-50e2-40c4-9736-bbff5d5717f7	78.9	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:23.543182
1a680f4f-3f4c-48d4-b3bd-f63aba933a4c	f4f76084-1119-4165-a682-e74454b60e24	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:23.543182
3286c2ea-d27d-44af-b975-b3e058fa773b	ba859dc1-eb13-4ede-9794-684351ed8e67	6.39	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:23.543182
f5918218-5ebf-487d-a6ce-701f22ab7f9e	5648b1b8-6461-4992-ba9a-74f03a54d31f	44.8	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:34.055322
9a35b32a-5902-40aa-86e7-129d459be86b	7ecb7c36-df68-400c-8002-09406937c006	1169	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:34.055322
af3b3fc4-cc8a-4a51-b6dd-d6ebe85a461d	4a1ef9a6-6ada-4b7c-b5dd-432598a991e3	7.8	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:34.055322
ae7c3892-8d0c-46ee-8476-f322ae97690a	88c1b9cc-ccde-45ce-b22f-af6006df0ace	100	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:34.055322
cf6822ae-858f-4aca-a676-b5cd8177038e	d441b749-64b9-4678-b2e7-949e884f207c	76.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:34.055322
f41012c1-4a63-4791-bab1-b13b123156d4	f26db41f-6bf1-4577-bf1c-9fe993221865	99.97	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:49.04759
94a27867-5b25-4301-88a8-df014d455135	b4b2525b-fd4e-4993-93ac-72879e0536fd	92.4	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:49.04759
af9bc80c-1392-4b9a-b020-aa84bee104d2	2a0e5039-cc18-42d6-be55-833114d010a6	1.39	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:49.04759
2fa9e453-b52a-4209-ace8-fe852e6c77ed	34415252-2c6b-438f-bf80-3439de814b79	84.8	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:49.04759
0b77412e-df6d-4f32-a352-8b3ef7e93110	f5a93fb4-10f3-433d-9c08-26ba1e7c1e61	0	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:49.04759
d34ee8eb-c7d2-40b6-bbd9-9d79011d4cf9	86e5abc7-5a1d-4a15-a3f4-044ceee4c77b	87.48	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
2bf3ec3c-327f-4706-98c3-f8103d53121a	692e9927-4813-45ef-9e49-c89ea5211b65	79.52	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
fba318b5-e5b5-4be1-98bf-79bdad8d05a7	0a8a7e6e-e914-4b6d-9dbe-160d9aad5ba0	83.1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
0900dda9-5fb3-4871-af5b-955e2d57ccd6	45869920-91b0-4bb2-9274-91fa5de45d9a	80.5	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
c6b68b5e-991c-47ab-8ce1-ec3239dac258	1ad6345d-3f26-40ae-a628-99cd6c7582a3	75.2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
0e4a7a7b-f875-4b09-aa39-244f9e3ce635	e2b83df4-d83a-4e58-9bf5-803c6761083d	68.9	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
e03373eb-6c05-4cf5-aff9-5aa8f7d32d25	fb7f77da-607d-49d8-b0c8-f9e1db59dd08	77.4	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
2c32e276-3b1b-45fb-bfb0-59b5e9ddc473	980ced6f-0059-4bf2-8f11-415939d45625	91.2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
3030fb48-c225-4242-8ede-64c6686eaafa	ea435dea-0cbd-4a3a-94f5-67399ae5ee41	38	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 04:16:25.935595
c715e881-0964-4eff-8f5a-042e11afa53a	9c2b5fa6-406d-487b-8284-cdc5855b6419	91.2	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 04:16:25.935595
1dc36f51-c677-4977-81d1-3566f207ae29	6b413e1f-8f2f-417d-bba0-03ee2e9a0e61	79.5	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 04:16:25.935595
9fdfeeaf-75ce-493a-8fce-2c4c297b6d41	c28d97ca-6aba-43c7-af88-9b14049565c3	1	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 04:16:25.935595
dfa45fb7-0d3b-48b7-ba07-b8439a1358ec	e1c4bc00-eb14-4ab7-b11b-2312bc0318af	88.4	2025-12	excel_import	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 04:16:25.935595
\.


--
-- Data for Name: kpi_dictionary; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_dictionary (id, action_verb, definition, formula_description, data_source, created_at) FROM stdin;
db5e2b0e-a11e-4204-b1c2-9e307cf1fc59	Infrastructure Availability	Ketersediaan jaringan utama dan kesiapan infrastruktur pemulihan bencana.	\N	Network Monitoring (NMS)	2026-03-07 04:36:56.461212
654587e8-dec5-4bfe-9357-b8aa336e5f2d	Fleet Technical Reliability	Keandalan teknis armada untuk mencegah gangguan jadwal penerbangan.	\N	AMOS (Maintenance System)	2026-03-07 04:36:56.461212
2a776c1a-93c8-4b30-873b-fcf38fced72d	Tax Compliance Rate	Tingkat kepatuhan pajak global tanpa denda administratif.	\N	Database Perpajakan	2026-03-07 04:36:56.461212
b0759e2c-2808-48b0-b101-08cd4f4ccbeb	Digital Sales Progress	Persentase penyelesaian fitur penjualan tiket dan integrasi NDC.	\N	Project Management Tool	2026-03-07 04:36:56.461212
406360bf-8831-4ea5-8630-ca1a24afd7e5	Financial Closing Cycle	Ketepatan waktu penyelesaian laporan keuangan bulanan.	\N	Log SAP Financial	2026-03-07 04:36:56.461212
9bbab452-3bd4-4ffe-9c63-e29387bac6ba	Talent Acquisition Velocity	Kecepatan pengisian posisi operasional kritis (Pilot/Teknisi).	\N	SAP HCM / ATS	2026-03-07 04:36:56.461212
379981a0-7756-49be-b197-31351e5760a4	Cybersecurity Maturity	Tingkat pertahanan siber dan efektivitas kontrol risiko data.	\N	Audit Keamanan Siber	2026-03-07 04:36:56.461212
725e591f-f057-48f2-af3f-53b2c9c2ad9b	Asset Integrity Index	Akurasi dokumen suku cadang dan kelaikan alat pendukung teknis.	\N	Inventori Teknik	2026-03-07 04:36:56.461212
0d62be83-2056-4932-a700-262db8e776e3	OpEx Variance Control	Pengendalian pengeluaran operasional agar sesuai dengan pagu anggaran.	\N	Budget Monitoring Report	2026-03-07 04:36:56.461212
d79d1e66-c75e-4879-adb2-7698d0ec7aba	Safety Training Index	Rasio penyelesaian pelatihan keselamatan wajib bagi personil.	\N	LMS (Learning System)	2026-03-07 04:36:56.461212
240b0125-693a-4fa5-8187-8f7a255ac183	Infrastructure Availability	Ketersediaan jaringan utama dan kesiapan infrastruktur pemulihan bencana.	\N	Network Monitoring (NMS)	2026-03-07 05:36:48.803572
9dc0de05-ed5e-43c9-b1de-cef71445d85a	Fleet Technical Reliability	Keandalan teknis armada untuk mencegah gangguan jadwal penerbangan.	\N	AMOS (Maintenance System)	2026-03-07 05:36:48.803572
1aa40037-f397-41b8-9bf7-c004a901b414	Tax Compliance Rate	Tingkat kepatuhan pajak global tanpa denda administratif.	\N	Database Perpajakan	2026-03-07 05:36:48.803572
6bcd029f-3882-4f56-8c4d-4e69969bd1a5	Digital Sales Progress	Persentase penyelesaian fitur penjualan tiket dan integrasi NDC.	\N	Project Management Tool	2026-03-07 05:36:48.803572
7fb50039-6fb9-4e5f-b72a-46eb07486559	Financial Closing Cycle	Ketepatan waktu penyelesaian laporan keuangan bulanan.	\N	Log SAP Financial	2026-03-07 05:36:48.803572
b4b569d1-a444-4e17-96be-7cd016e81158	Talent Acquisition Velocity	Kecepatan pengisian posisi operasional kritis (Pilot/Teknisi).	\N	SAP HCM / ATS	2026-03-07 05:36:48.803572
4acbede3-6d5f-4884-a5a7-8237ce5d59ba	Cybersecurity Maturity	Tingkat pertahanan siber dan efektivitas kontrol risiko data.	\N	Audit Keamanan Siber	2026-03-07 05:36:48.803572
260f8f28-bbb0-4a2c-b686-00b15a923fb5	Asset Integrity Index	Akurasi dokumen suku cadang dan kelaikan alat pendukung teknis.	\N	Inventori Teknik	2026-03-07 05:36:48.803572
698dfd93-bde5-4a22-ac8e-8d23eb1b110f	OpEx Variance Control	Pengendalian pengeluaran operasional agar sesuai dengan pagu anggaran.	\N	Budget Monitoring Report	2026-03-07 05:36:48.803572
920c3e46-b2ab-4663-bf4f-346415d67c6d	Safety Training Index	Rasio penyelesaian pelatihan keselamatan wajib bagi personil.	\N	LMS (Learning System)	2026-03-07 05:36:48.803572
\.


--
-- Data for Name: kpi_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_items (id, entity_type, dept_id, period, no, objective, action_verb, target_from, target_to, parameter, bobot, polaritas, cascaded_from, key_drivers, remarks, created_at) FROM stdin;
13b6968a-ce49-49e8-8308-825a6ba6fa98	department	00000000-0000-0000-0000-000000000005	2025-12	1	Menjamin keandalan infrastruktur dan pemulihan bencana	Infrastructure Availability & DR Readiness	99.7	99.99	%	0.2	Max	No. 7 Cybersecurity & Data Privacy Maturity	1. Implementasi HA pada jaringan utama.	Gabungan ketersediaan jaringan dan kesiapan pemulihan.	2026-03-09 02:07:56.477128
6e1b40de-17ed-4e5e-8a59-e04d52d36f73	department	00000000-0000-0000-0000-000000000005	2025-12	2	Akselerasi transformasi digital dan kanal penjualan	Digital Sales Product Development Progress	50	100	% (Progress)	0.2	Max	No. 6 Commercial Growth & Ancillary Revenue	1. Fitur Core System (Web/App).	Fokus pada penyelesaian fitur penjualan tiket.	2026-03-09 02:07:56.477128
928aa65c-3169-4d6b-b118-f048a743d6bd	department	00000000-0000-0000-0000-000000000005	2025-12	3	Optimalisasi monetisasi produk tambahan (Ancillary)	Deployment Ancillary Merchandising Engine	1	2	Channels	0.1	Max	No. 6 Commercial Growth & Ancillary Revenue	1. Fitur Dynamic Pricing.	Menambah jumlah kanal yang mendukung fitur ancillary.	2026-03-09 02:07:56.477128
f4812eea-56a2-49dc-bb3b-8ac37b83af9c	department	00000000-0000-0000-0000-000000000005	2025-12	4	Integrasi sistem manajemen perusahaan (ERP)	ERP SAP S/4HANA Readiness & Integration	30	100	% (Readiness)	0.15	Max	No. 5 Digital Transformation & SAP Integration	1. Compliance perangkat user.	Sinergi antara kesiapan hardware dan integrasi software.	2026-03-09 02:07:56.477128
cfb7e3c7-7e8b-43c3-a520-f3e659d1834a	department	00000000-0000-0000-0000-000000000005	2025-12	5	Penguatan keamanan siber dan perlindungan data	Cybersecurity Maturity & Risk Control	75	95	%	0.15	Max	No. 7 Cybersecurity & Data Privacy Maturity	1. Remediasi kerentanan sistem.	Menjaga tingkat keamanan dari ancaman siber.	2026-03-09 02:07:56.477128
b87ee64f-bf3c-4696-bd9c-f44234b4c172	department	00000000-0000-0000-0000-000000000005	2025-12	6	Efisiensi biaya IT dan tata kelola aset	IT Cost & Asset Management Efficiency	75	90	%	0.1	Max	No. 3 Cost Leadership & CASK Optimization	1. Cloud utilization efficiency.	Mengatur pengeluaran cloud dan ketertiban aset fisik.	2026-03-09 02:07:56.477128
e81558a0-0af2-4121-89d4-0980f9dc7002	department	00000000-0000-0000-0000-000000000005	2025-12	7	Peningkatan kualitas layanan dukungan teknologi	IT Service Excellence & Quality Score	3.5	4.5	Score (1-5)	0.1	Max	No. 2 On-Time Performance (OTP) & Ops Reliability	1. Pencapaian MTTR & FCR.	Mengukur kepuasan user dan kualitas kode aplikasi.	2026-03-09 02:07:56.477128
ade47d1c-067a-4b64-bd57-7f24383e50de	department	00000000-0000-0000-0000-000000000004	2025-12	1	Transformasi digital dan kesiapan sistem personil	Digital HR Maturity & SAP HCM Readiness	30	100	%	0.15	Max	No. 5 Digital Transformation & SAP Integration	Migrasi data ATS, integrasi payroll real-time, dan sertifikasi user SAP.	Menjamin ekosistem teknologi SDM terintegrasi penuh.	2026-03-09 02:08:09.367373
2dc5442e-de00-4b3e-a62d-6ea191a339d8	department	00000000-0000-0000-0000-000000000004	2025-12	2	Memastikan ketersediaan kru dan staf operasional	Talent Acquisition Velocity (Time-to-Fill)	60	45	Hari	0.15	Min	No. 2 On-Time Performance (OTP) & Ops Reliability	Implementasi AI Screening dan penguatan Cadet Program.	Percepatan pengisian posisi kritis (Pilot/Teknisi) untuk menjaga jadwal terbang.	2026-03-09 02:08:09.367373
0eda0474-fcf7-4bdc-b77b-9d3244355dfa	department	00000000-0000-0000-0000-000000000004	2025-12	3	Menjamin standar keselamatan dan kualitas layanan	Safety Compliance & Service Training Index	85	100	%	0.2	Max	No. 1 Safety & Airworthiness Excellence Index	Penyelesaian training regulatori (SMS) dan Service Excellence.	Kepatuhan mutlak pada regulasi aviasi dan standar layanan bintang 5.	2026-03-09 02:08:09.367373
5689f054-0f9e-4f79-bf15-b47d36d1963d	department	00000000-0000-0000-0000-000000000004	2025-12	4	Optimalisasi produktivitas dan kesiapan kerja	Workforce Productivity & Onboarding Speed	70	90	%	0.15	Max	No. 2 On-Time Performance (OTP) & Ops Reliability	Penurunan time-to-productivity dan ketepatan disbursement gaji.	Memastikan karyawan baru segera siap berkontribusi secara efektif.	2026-03-09 02:08:09.367373
863e0ce4-bb8e-41ba-bba3-86fa5a9737f5	department	00000000-0000-0000-0000-000000000004	2025-12	5	Meningkatkan retensi dan kepuasan karyawan	Retention Rate & Employee Satisfaction Index	70	90	%	0.15	Max	No. 3 Cost Leadership & CASK Optimization	Optimalisasi benefit fleksibel dan peningkatan Candidate Experience.	Fokus pada loyalitas talenta terbaik melalui EVP yang kuat.	2026-03-09 02:08:09.367373
a7618a87-c2a6-4766-a38b-1937c8424e70	department	00000000-0000-0000-0000-000000000004	2025-12	6	Menjamin kepatuhan regulasi dan audit personil	Statutory Compliance & Audit Integrity	96	100	%	0.1	Max	No. 8 Corporate Governance & Legal Compliance	Otomasi pelaporan pajak dan iuran sosial serta zero audit finding.	Mitigasi risiko hukum dan denda ketenagakerjaan.	2026-03-09 02:08:09.367373
54817013-81df-48fc-9ede-3547314144e4	department	00000000-0000-0000-0000-000000000004	2025-12	7	Efisiensi biaya tenaga kerja dan pengembangan	Human Capital Cost Efficiency (CASK Support)	10	3	% (Deviasi)	0.1	Min	No. 3 Cost Leadership & CASK Optimization	Kontrol overtime, efisiensi cost per hire, dan training cost.	Mendukung target biaya unit maskapai melalui manajemen budget SDM.	2026-03-09 02:08:09.367373
628cd574-f1a0-482a-ae6d-5d6ca567fe9d	department	00000000-0000-0000-0000-000000000003	2025-12	1	Menjamin akurasi dan kecepatan pelaporan keuangan	Financial Closing & Reporting Cycle Time	90	100	%	0.15	Max	No. 8 Corporate Governance & Legal Compliance	Otomasi rekonsiliasi dan cutoff akrual yang ketat.	Fokus pada ketepatan waktu submission laporan bulanan.	2026-03-09 02:08:28.407769
967075a2-4c71-4e00-aa86-87060ce3db5a	department	00000000-0000-0000-0000-000000000003	2025-12	2	Menjaga stabilitas likuiditas dan mitigasi risiko pasar	Cash Flow Forecast Accuracy & Liquidity Adherence	75	95	%	0.2	Max	No. 4 Financial Strategy & Liquidity Resilience	Monitoring buffer kas harian dan efektivitas hedging valas.	Krusial untuk maskapai dengan biaya avtur dalam USD.	2026-03-09 02:08:28.407769
44af8ebb-2257-445e-bdce-2b8a4fb5df3c	department	00000000-0000-0000-0000-000000000003	2025-12	3	Pengendalian pengeluaran operasional perusahaan	OpEx Variance Control & Compliance	80	95	%	0.15	Max	No. 3 Cost Leadership & CASK Optimization	Efisiensi Operasional (CASK) Audit Maverick Spend dan akurasi FAR (Fixed Asset).	Memastikan biaya sesuai budget dan kontrak resmi.	2026-03-09 02:08:28.407769
e8768b43-b0f0-4cc5-8121-a3a2886345cd	department	00000000-0000-0000-0000-000000000003	2025-12	4	Mempertahankan integritas data dan kepatuhan audit	External Audit Integrity Score	8	2	Findings	0.1	Min	No. 8 Corporate Governance & Legal Compliance	Penguatan kontrol internal (ICFR) dan rekonsiliasi harian.	Meminimalisir temuan audit material (Unqualified Opinion).	2026-03-09 02:08:28.407769
f337f458-ddf1-4f17-af53-10bffb96212b	department	00000000-0000-0000-0000-000000000003	2025-12	5	Mendukung ketepatan waktu operasional maskapai	Procurement Lead Time & Support Efficiency	15	10	Hari Kerja	0.1	Min	No. 2 On-Time Performance (OTP) & Ops Reliability	Otomasi alur PO dan standarisasi RFQ.	Kecepatan pengadaan mendukung ketersediaan suku cadang.	2026-03-09 02:08:28.407769
61b66c49-238d-4bd9-bb56-c59137be1c75	department	00000000-0000-0000-0000-000000000003	2025-12	6	Akselerasi digitalisasi dan modernisasi finansial	SAP Financial & E-Procurement Maturity Rate	60	100	%	0.1	Max	No. 5 Digital Transformation & SAP Integration	Migrasi tender digital dan integrasi end-to-end ke SAP.	Menghilangkan proses manual dan meningkatkan transparansi.	2026-03-09 02:08:28.407769
a57aac4c-cf65-4289-ab7f-8b4414d0a907	department	00000000-0000-0000-0000-000000000003	2025-12	7	Menjamin kepatuhan regulasi perpajakan global	Tax Compliance & Accuracy Rate	5	0	Case	0.1	Min	No. 8 Corporate Governance & Legal Compliance	Sinkronisasi database tiket dengan pelaporan pajak.	Menghindari denda pajak yang tidak memberi nilai tambah.	2026-03-09 02:08:28.407769
94160e30-16a4-48de-9067-d8f516193cf5	department	00000000-0000-0000-0000-000000000003	2025-12	8	Maksimalisasi efisiensi biaya dan imbal hasil	Total Cost Savings & Investment Yield	5	10	%	0.1	Max	No. 4 Financial Strategy & Liquidity Resilience	Negosiasi kontrak payung dan optimasi yield idle cash.	Penghematan strategis dan pendapatan bunga investasi.	2026-03-09 02:08:28.407769
314c1b46-c0b4-4f72-89a6-1beff95f456c	department	00000000-0000-0000-0000-000000000002	2025-12	1	Menjamin keandalan operasional armada pesawat	Fleet Technical Reliability & Readiness	85	98	%	0.2	Max	No. 2 On-Time Performance (OTP) & Ops Reliability	Monitoring Technical Delay dan kesiapan lisensi personel.	Kunci utama dukungan teknik terhadap jadwal penerbangan.	2026-03-09 02:08:45.349688
b4343399-9005-48a1-be96-a8731d1d966c	department	00000000-0000-0000-0000-000000000002	2025-12	2	Menjamin integritas aset teknis dan suku cadang	Asset Integrity & Parts Traceability Index	88	98	%	0.15	Max	No. 1 Safety & Airworthiness Excellence Index	Kontrol GSE Serviceability dan akurasi dokumen suku cadang.	Mencegah penggunaan komponen ilegal dan kerusakan alat pendukung.	2026-03-09 02:08:45.349688
17507025-8268-40a6-b145-5380098809e4	department	00000000-0000-0000-0000-000000000002	2025-12	3	Akselerasi modernisasi dan efisiensi armada	Fleet Modernization & Retrofit Execution	60	100	% (Progress)	0.15	Max	No. 3 Cost Leadership & CASK Optimization	Penyelesaian program retrofit interior dan instalasi WiFi.	Meningkatkan daya saing armada dan efisiensi bahan bakar.	2026-03-09 02:08:45.349688
c89760b7-9355-46ef-a907-af009b0da930	department	00000000-0000-0000-0000-000000000002	2025-12	4	Optimalisasi biaya teknik dan produktivitas SDM	Maintenance Cost & Resource Efficiency	80	95	%	0.15	Max	No. 3 Cost Leadership & CASK Optimization	Kontrol man-hour utilization dan varians anggaran proyek.	Menjaga pengeluaran teknik tetap kompetitif (Low CASK).	2026-03-09 02:08:45.349688
5bd9c989-adef-4fa4-8bf5-212c011a56b0	department	00000000-0000-0000-0000-000000000002	2025-12	5	Transformasi digital operasional teknik	Engineering Digitalization & Data Integrity	75	98	%	0.15	Max	No. 5 Digital Transformation & SAP Integration	Implementasi e-Logbook dan PMIS secara real-time.	Memastikan integritas data teknis dari lapangan ke sistem pusat.	2026-03-09 02:08:45.349688
18799fce-2c4e-45cf-b4ad-9d77d88c71e8	department	00000000-0000-0000-0000-000000000002	2025-12	6	Penegakan standar keselamatan dan kualitas	Safety & Quality Management Excellence	90	100	%	0.2	Max	No. 1 Safety & Airworthiness Excellence Index	Pemenuhan program audit dan penutupan temuan tepat waktu.	Kepatuhan mutlak pada regulasi kelaikan udara (DGCA/FAA).	2026-03-09 02:08:45.349688
1bd51b02-e74a-4d64-9eb0-389af95bcd9a	unit	00000000-0000-0000-0000-000000000011	2025-12	1	Menjamin ketepatan waktu penyelesaian proyek strategis	Meningkatkan Project Milestone Adherence Rate	82	95	%	0.25	Max	No. 1 Fleet Technical Reliability & Readiness\nNo. 5 Engineering Digitalization & Data Integrity	1. Sinkronisasi Integrated Master Schedule dengan ketersediaan slot hangar.	Keterlambatan proyek besar berdampak sistemik pada jadwal terbang tahunan.	2026-03-09 02:09:22.224591
b0496787-bad7-459f-991a-cde80248ef2e	unit	00000000-0000-0000-0000-000000000011	2025-12	2	Pengendalian anggaran proyek teknik dan investasi	Menurunkan Project Budget Variance	10	5	% (Deviasi)	0.2	Min	No. 4 Maintenance Cost & Resource Efficiency	1. Validasi detail Bill of Quantities (BOQ) sebelum proyek dimulai.	Memastikan pengeluaran investasi teknik (CapEx) tetap terkendali.	2026-03-09 02:09:22.224591
205e2606-097b-415e-ba74-aaf1b28c76f2	unit	00000000-0000-0000-0000-000000000011	2025-12	3	Menjamin kualitas dan ketepatan waktu deliverables vendor	Meningkatkan Vendor/MRO Performance Scorecard	80	90	Score (1-100)	0.2	Max	No. 2 Asset Integrity & Parts Traceability Index	1. Audit berkala terhadap kualitas pengerjaan di fasilitas vendor.	Keberhasilan proyek sangat bergantung pada disiplin vendor luar.	2026-03-09 02:09:22.224591
5abcae28-f8b5-48fa-8191-3d01685c3fcc	unit	00000000-0000-0000-0000-000000000011	2025-12	4	Penyelesaian program peremajaan dan modifikasi armada	Penyelesaian Major Retrofit/Modification Program	70	100	% (Progress)	0.2	Max	No. 3 Fleet Modernization & Retrofit Execution	1. Perencanaan optimasi slot modifikasi untuk meminimalkan aircraft downtime.	Contoh: Proyek penggantian kursi atau instalasi WiFi di pesawat.	2026-03-09 02:09:22.224591
bd3f0aa1-a406-4eaa-bcd8-aa774bf6ac04	unit	00000000-0000-0000-0000-000000000011	2025-12	5	Pengelolaan risiko proyek secara proaktif	Pencapaian Project Risk Mitigation Index	85	100	%	0.15	Max	No. 6 Safety & Quality Management Excellence	1. Pembaruan matriks risiko proyek dan rencana mitigasi setiap kuartal.	Memastikan proyek selesai tidak hanya fisik, tapi juga legal dan administratif.	2026-03-09 02:09:22.224591
0edca355-3929-4ef7-b930-4269c7eb91d4	unit	00000000-0000-0000-0000-000000000012	2025-12	1	Menjamin kepatuhan seluruh operasional teknik terhadap regulasi	Pencapaian Audit Program Fulfillment	90	100	%	0.25	Max	No. 6 Safety & Quality Management Excellence	1. Pelaksanaan jadwal audit internal (CAME/SOP) secara tepat waktu.	Fokus pada pemenuhan kewajiban audit tahunan tanpa ada yang terlewat.	2026-03-09 02:09:33.176313
be78b58b-1333-4fdb-b551-9fd5d727b78c	unit	00000000-0000-0000-0000-000000000012	2025-12	2	Percepatan penyelesaian temuan audit teknis	Menurunkan Lead Time Closure of Audit Findings	45	30	Hari	0.2	Min	No. 6 Safety & Quality Management Excellence	1. Validasi efektivitas Root Cause Analysis (RCA) yang diajukan unit terkait.	Semakin cepat temuan ditutup, semakin rendah risiko legalitas pesawat.	2026-03-09 02:09:33.176313
83c08733-eb5d-4153-91ad-9f61d5a12d2f	unit	00000000-0000-0000-0000-000000000012	2025-12	3	Memastikan kelaikan lisensi seluruh personel teknik	Mencapai Zero Personnel License Expiry	2	0	Case	0.2	Min	No. 1 Fleet Technical Reliability & Readiness	1. Otomasi sistem peringatan dini (H-90) sebelum masa berlaku lisensi teknisi habis.	Teknisi tanpa lisensi aktif dilarang keras merilis pesawat (No Go).	2026-03-09 02:09:33.176313
d7720037-2a79-4f0f-9e04-d3e5d691f64a	unit	00000000-0000-0000-0000-000000000012	2025-12	4	Menjaga integritas dan keterlacakan komponen pesawat	Meningkatkan Spare Parts Traceability & Documentation Accuracy	92	100	%	0.2	Max	No. 2 Asset Integrity & Parts Traceability Index	1. Audit berkala terhadap sertifikat asli (EASA Form 1/FAA 8130) di gudang logistik.	Mencegah masuknya komponen ilegal (Unapproved Parts) ke armada.	2026-03-09 02:09:33.176313
b68fbf27-c583-4288-912d-5f5f1f058bd5	unit	00000000-0000-0000-0000-000000000012	2025-12	5	Mempertahankan sertifikasi dan izin terbang internasional	Mencapai Zero Major Finding pada External Audit (IOSA/Otoritas)	1	0	Findings	0.15	Min	No. 6 Safety & Quality Management Excellence	1. Pelaksanaan Mock-Audit (simulasi) sebelum kedatangan auditor eksternal.	Menjaga kepercayaan internasional dan izin terbang maskapai.	2026-03-09 02:09:33.176313
73aea8ff-17bf-42a1-b721-85477d02d644	unit	00000000-0000-0000-0000-000000000020	2025-12	1	Mencapai efisiensi biaya pengadaan barang dan jasa	Meningkatkan Strategic Cost Savings Rate	5	10	%	0.25	Max	No. 8 Total Cost Savings & Investment Yield	1. Negosiasi kontrak payung (Framework Agreement) untuk suku cadang high-volume.	Kontribusi langsung terhadap penurunan biaya operasional perusahaan.	2026-03-09 02:09:50.624351
5a105ffd-9efd-40fa-92d3-3dffbc310143	unit	00000000-0000-0000-0000-000000000020	2025-12	2	Mempercepat siklus pengadaan untuk mendukung operasional	Menurunkan Procurement Cycle Time (Non-AOG)	15	10	Hari Kerja	0.2	Min	No. 5 Procurement Lead Time & Support Efficiency	1. Otomasi alur persetujuan Purchase Order (PO) melalui sistem ERP.	Kecepatan pengadaan mencegah penumpukan pekerjaan di unit teknis.	2026-03-09 02:09:50.624351
42ace29e-151a-4bdc-adf6-17f8713b8731	unit	00000000-0000-0000-0000-000000000020	2025-12	3	Memastikan kualitas dan keandalan pemasok strategis	Meningkatkan Vendor Performance Scorecard Index	80	92	Score (1-100)	0.2	Max	No. 8 Total Cost Savings & Investment Yield	1. Audit berkala terhadap kepatuhan vendor terhadap standar kualitas dan legalitas.	Vendor yang buruk meningkatkan risiko operasional dan keselamatan.	2026-03-09 02:09:50.624351
001a061f-6b32-4985-9f85-4a76124f4b71	unit	00000000-0000-0000-0000-000000000020	2025-12	4	Digitalisasi penuh proses pengadaan perusahaan	Pencapaian E-Procurement Adoption Rate	70	100	%	0.2	Max	No. 6 SAP Financial & E-Procurement Maturity Rate	1. Migrasi 100% proses tender dan kontrak ke dalam platform digital.	Menghilangkan proses manual dan meningkatkan akuntabilitas pengadaan.	2026-03-09 02:09:50.624351
2b199d34-1199-4a7c-9612-561ef6df1683	unit	00000000-0000-0000-0000-000000000020	2025-12	5	Memastikan pembelian sesuai dengan kontrak dan prosedur	Meningkatkan Contract Compliance Rate	90	98	%	0.15	Max	No. 3 OpEx Variance Control & Compliance	1. Audit harian terhadap pembelian yang dilakukan di luar kontrak resmi (Maverick Spend).	Memastikan perusahaan mendapatkan harga terbaik sesuai kesepakatan awal.	2026-03-09 02:09:50.624351
f9598cae-328d-4e52-adf1-4742ad14f1c6	unit	00000000-0000-0000-0000-000000000021	2025-12	1	Menjamin kepatuhan standar keselamatan melalui pelatihan regulasi	Penyelesaian Mandatory Regulatory Training (Safety & SMS)	92	100	%	0.25	Max		1. Implementasi sistem pengingat otomatis (Auto-alert) harian untuk lisensi kadaluwarsa.	Kepatuhan mutlak untuk mempertahankan izin terbang personel.	2026-03-09 02:10:26.328769
6739a613-9508-4537-8998-a8337d2a124f	unit	00000000-0000-0000-0000-000000000021	2025-12	2	Memastikan kesiapan pengguna dalam adopsi sistem SAP	Pencapaian SAP HCM User Proficiency Score	70	85	Score (1-100)	0.2	Max		1. Penyelenggaraan Hands-on Workshop intensif untuk setiap modul SAP HCM.	Menjamin investasi teknologi SAP dapat dioperasikan secara maksimal.	2026-03-09 02:10:26.328769
7db0a47d-40cf-4007-8efe-49923919a7ff	unit	00000000-0000-0000-0000-000000000021	2025-12	3	Meningkatkan standar layanan kepada penumpang	Meningkatkan Service Excellence Training Index	80	92	Index	0.2	Max		1. Pelaksanaan sesi Role-play simulasi penanganan komplain penumpang bagi kru kabin.	Berdampak langsung pada peningkatan loyalitas pelanggan.	2026-03-09 02:10:26.328769
0482f029-c51c-46b7-884a-003584635b9f	unit	00000000-0000-0000-0000-000000000021	2025-12	4	Mempercepat produktivitas karyawan baru	Menurunkan Time-to-Productivity (Onboarding Program)	30	20	Hari	0.2	Min		1. Digitalisasi materi orientasi umum agar dapat dipelajari mandiri sebelum hari kerja.	Memastikan karyawan baru segera berkontribusi pada target unitnya.	2026-03-09 02:10:26.328769
ca0fb778-06cc-4e4f-93a5-f4879e4aaa92	unit	00000000-0000-0000-0000-000000000021	2025-12	5	Mengoptimalkan efisiensi biaya penyelenggaraan pelatihan	Menurunkan Training Cost per Participant (Efficiency)	400	320	USD	0.15	Min		1. Peralihan 60% pelatihan kelas fisik menjadi metode Blended Learning (Online).	Mendukung target efisiensi biaya unit secara keseluruhan.	2026-03-09 02:10:26.328769
6a0cbe7a-c230-4437-ba84-214dcada6063	unit	00000000-0000-0000-0000-000000000030	2025-12	1	Menjamin akurasi total dalam perhitungan kompensasi karyawan	Meningkatkan Payroll Accuracy Rate	98.5	100	%	0.25	Max		1. Integrasi otomatis antara sistem Flight Ops dan payroll untuk allowance kru real-time.	Akurasi sangat krusial untuk menjaga kepercayaan karyawan.	2026-03-09 02:11:23.543182
3ba77b89-e3b6-4c87-9e45-0eef1ef1bb08	unit	00000000-0000-0000-0000-000000000030	2025-12	2	Memastikan ketepatan waktu distribusi gaji seluruh karyawan	Meningkatkan On-time Payroll Disbursement	95	100	%	0.2	Max		1. Penetapan batas waktu (Cutoff) yang ketat untuk pengiriman data variabel gaji.	Keterlambatan gaji berdampak langsung pada motivasi dan stabilitas operasional.	2026-03-09 02:11:23.543182
1a8f2cf0-50e2-40c4-9736-bbff5d5717f7	unit	00000000-0000-0000-0000-000000000030	2025-12	3	Meningkatkan kepuasan karyawan terhadap paket tunjangan	Meningkatkan Benefit Utilization & Satisfaction Index	72	85	Score	0.2	Max		1. Digitalisasi pengelolaan tunjangan perjalanan karyawan (Staff Travel/ID90) via mobile.	Tunjangan yang kompetitif merupakan kunci retensi karyawan terbaik.	2026-03-09 02:11:23.543182
f4f76084-1119-4165-a682-e74454b60e24	unit	00000000-0000-0000-0000-000000000030	2025-12	4	Memastikan kepatuhan penuh dalam administrasi pajak karyawan	Mencapai Statutory Compliance & Tax Filing Accuracy	95	100	%	0.2	Max		1. Otomasi pembuatan formulir pajak (PPh 21/Pajak Internasional) dari SAP.	Kepatuhan mencegah denda hukum dan menjaga reputasi perusahaan.	2026-03-09 02:11:23.543182
ba859dc1-eb13-4ede-9794-684351ed8e67	unit	00000000-0000-0000-0000-000000000030	2025-12	5	Mengendalikan biaya overtime dan tunjangan agar sesuai anggaran	Menurunkan Overtime & Benefit Cost Variance	8	3	% (Deviasi)	0.15	Min		1. Pelaporan real-time jam lembur per departemen kepada manajemen untuk pengawasan.	Membantu mencapai target efisiensi biaya unit (CASK) secara keseluruhan.	2026-03-09 02:11:23.543182
5648b1b8-6461-4992-ba9a-74f03a54d31f	unit	00000000-0000-0000-0000-000000000032	2025-12	1	Mempercepat pemenuhan posisi operasional kritis	Menurunkan Time-to-Fill (Critical Roles)	60	45	Hari	0.25	Min		1. Implementasi AI-Resume Screening untuk mempercepat seleksi awal.	Posisi Pilot dan Teknisi harus diisi cepat untuk menjaga OTP.	2026-03-09 02:11:34.055322
7ecb7c36-df68-400c-8002-09406937c006	unit	00000000-0000-0000-0000-000000000032	2025-12	2	Mengendalikan biaya rekrutmen agar efisien	Menurunkan Average Cost per Hire	1300	1100	USD	0.2	Min		1. Optimalisasi penggunaan media sosial (LinkedIn/Careers Site) sebagai kanal utama.	Mendukung target efisiensi biaya operasional (CASK).	2026-03-09 02:11:34.055322
4a1ef9a6-6ada-4b7c-b5dd-432598a991e3	unit	00000000-0000-0000-0000-000000000032	2025-12	3	Meningkatkan kualitas rekrutmen untuk mengurangi turnover dini	Menurunkan First-Year Turnover Rate	10	5	%	0.2	Min		1. Penerapan Psychometric Testing yang disesuaikan dengan budaya maskapai.	Karyawan baru yang berkualitas akan bertahan lebih lama dan lebih produktif.	2026-03-09 02:11:34.055322
88c1b9cc-ccde-45ce-b22f-af6006df0ace	unit	00000000-0000-0000-0000-000000000032	2025-12	4	Digitalisasi penuh proses rekrutmen perusahaan	Meningkatkan ATS (Applicant Tracking System) Adoption Rate	60	100	%	0.2	Max		1. Migrasi 100% data pelamar ke dalam modul rekrutmen SAP/ATS.	Menghilangkan proses admin manual dan meningkatkan transparansi data.	2026-03-09 02:11:34.055322
d441b749-64b9-4678-b2e7-949e884f207c	unit	00000000-0000-0000-0000-000000000032	2025-12	5	Membangun reputasi sebagai perusahaan pilihan talenta terbaik	Meningkatkan Candidate Experience Score (NPS)	60	80	Score	0.15	Max		1. Pengurangan durasi proses seleksi dari pendaftaran hingga pengumuman.	Membangun reputasi perusahaan sebagai Employer of Choice.	2026-03-09 02:11:34.055322
f26db41f-6bf1-4577-bf1c-9fe993221865	unit	00000000-0000-0000-0000-000000000040	2025-12	1	Menjamin ketersediaan infrastruktur jaringan dan pusat data	Meningkatkan Infrastructure & Network Availability	99.7	99.99	%	0.25	Max	No. 1 Infrastructure Availability & DR Readiness	1. Implementasi konfigurasi High Availability (HA) pada seluruh node jaringan utama.	Menjamin konektivitas tanpa putus untuk sistem reservasi dan operasional bandara.	2026-03-09 02:11:49.04759
b4b2525b-fd4e-4993-93ac-72879e0536fd	unit	00000000-0000-0000-0000-000000000040	2025-12	2	Memperkuat ketahanan sistem dari ancaman siber	Meningkatkan Vulnerability Remediation Rate	88	95	%	0.2	Max	No. 5 Cybersecurity Maturity & Risk Control	1. Pelaksanaan pemindaian kerentanan (Vulnerability Scanning) otomatis setiap minggu.	Mencegah kebocoran data penumpang dan gangguan sistem akibat ransomware.	2026-03-09 02:11:49.04759
2a0e5039-cc18-42d6-be55-833114d010a6	unit	00000000-0000-0000-0000-000000000040	2025-12	3	Memastikan keberlangsungan bisnis saat bencana atau gangguan besar	Meningkatkan Disaster Recovery Readiness Score (RTO/RPO)	2	1	Jam (RTO)	0.2	Min	No. 1 Infrastructure Availability & DR Readiness	1. Pelaksanaan simulasi Failover ke pusat data cadangan (DRC) setiap semester.	Meminimalkan waktu henti bisnis jika pusat data utama mengalami gangguan total.	2026-03-09 02:11:49.04759
34415252-2c6b-438f-bf80-3439de814b79	unit	00000000-0000-0000-0000-000000000040	2025-12	4	Mengoptimalkan pemanfaatan sumber daya komputasi cloud	Meningkatkan Cloud Resource Utilization Efficiency	70	85	%	0.2	Max	No. 6 IT Cost & Asset Management Efficiency	1. Penerapan fitur Auto-scaling untuk menyesuaikan kapasitas server dengan trafik harian.	Mendukung efisiensi biaya unit (CASK) melalui manajemen pengeluaran IT yang ketat.	2026-03-09 02:11:49.04759
f5a93fb4-10f3-433d-9c08-26ba1e7c1e61	unit	00000000-0000-0000-0000-000000000040	2025-12	5	Mencegah akses tidak sah ke sistem dan data perusahaan	Mencapai Zero Unauthorised Access Incident	2	0	Case	0.15	Min	No. 5 Cybersecurity Maturity & Risk Control	1. Implementasi 100% Multi-Factor Authentication (MFA) untuk akses staf ke sistem inti.	Melindungi integritas sistem dari penggunaan oleh pihak yang tidak berwenang.	2026-03-09 02:11:49.04759
86e5abc7-5a1d-4a15-a3f4-044ceee4c77b	corporate	00000000-0000-0000-0000-000000000001	2025-12	1	Menjamin standar kelaikan udara dan keselamatan fisik	Safety & Airworthiness Excellence Index	90	100	%	0.25	Max		Integritas suku cadang, kepatuhan audit hangar, dan training SMS.	Pilar utama; kegagalan di sini adalah No-Go bagi maskapai.	2026-03-09 02:22:18.655032
692e9927-4813-45ef-9e49-c89ea5211b65	corporate	00000000-0000-0000-0000-000000000001	2025-12	2	Mengoptimalkan keandalan jadwal penerbangan	On-Time Performance (OTP) & Ops Reliability	80	95	%	0.15	Max		Penurunan technical delay, kecepatan rekrutmen kru, dan efisiensi pengadaan.	Mencerminkan kualitas produk inti maskapai kepada penumpang.	2026-03-09 02:22:18.655032
0a8a7e6e-e914-4b6d-9dbe-160d9aad5ba0	corporate	00000000-0000-0000-0000-000000000001	2025-12	3	Pengendalian biaya unit dan efisiensi sumber daya	Cost Leadership & CASK Optimization	85	98	%	0.15	Max		Efisiensi biaya maintenance, kontrol overtime SDM, dan IT cloud cost.	Menjaga daya saing harga tiket melalui biaya operasional rendah.	2026-03-09 02:22:18.655032
45869920-91b0-4bb2-9274-91fa5de45d9a	corporate	00000000-0000-0000-0000-000000000001	2025-12	4	Menjamin ketahanan kas dan mitigasi risiko pasar	Financial Strategy & Liquidity Resilience	75	95	%	0.1	Max		Akurasi forecast cash flow, yield investasi, dan efektivitas hedging valas.	Melindungi perusahaan dari fluktuasi harga avtur dan kurs USD.	2026-03-09 02:22:18.655032
1ad6345d-3f26-40ae-a628-99cd6c7582a3	corporate	00000000-0000-0000-0000-000000000001	2025-12	5	Akselerasi modernisasi sistem dan integrasi ERP	Digital Transformation & SAP Integration	40	100	%	0.1	Max		Penuntasan modul SAP (Fin/HCM), e-Logbook, dan modernisasi armada.	Menghilangkan hambatan proses manual untuk efisiensi jangka panjang.	2026-03-09 02:22:18.655032
e2b83df4-d83a-4e58-9bf5-803c6761083d	corporate	00000000-0000-0000-0000-000000000001	2025-12	6	Maksimalisasi pendapatan langsung dan ancillary	Commercial Growth & Ancillary Revenue	50	95	%	0.1	Max		Penyelesaian fitur penjualan digital, modul NDC, dan merchandising engine.	Fokus pada pertumbuhan profitabilitas di luar tiket utama.	2026-03-09 02:22:18.655032
fb7f77da-607d-49d8-b0c8-f9e1db59dd08	corporate	00000000-0000-0000-0000-000000000001	2025-12	7	Perlindungan aset digital dan infrastruktur kritis	Cybersecurity & Data Privacy Maturity	75	98	%	0.075	Max		Zero unauthorised access dan kelaikan disaster recovery (DRP).	Melindungi data penumpang dan keberlangsungan sistem dari serangan siber.	2026-03-09 02:22:18.655032
980ced6f-0059-4bf2-8f11-415939d45625	corporate	00000000-0000-0000-0000-000000000001	2025-12	8	Menjamin tata kelola, legalitas, dan kepatuhan pajak	Corporate Governance & Legal Compliance	90	100	%	0.075	Max		Zero tax penalty, integritas audit eksternal, dan kepatuhan aturan kerja.	Menghindari denda regulasi dan menjaga reputasi di mata investor.	2026-03-09 02:22:18.655032
ea435dea-0cbd-4a3a-94f5-67399ae5ee41	unit	00000000-0000-0000-0000-000000000010	2025-12	1	Meminimalkan waktu penyelesaian gangguan teknis di apron	Menurunkan Average Technical Delay Duration	45	30	Minutes	0.25	Min	No. 1 Fleet Technical Reliability & Readiness	1. Penempatan tim Quick Response di titik parkir pesawat utama.	Berdampak langsung pada ketepatan waktu keberangkatan (OTP).	2026-03-09 04:16:25.935595
9c2b5fa6-406d-487b-8284-cdc5855b6419	unit	00000000-0000-0000-0000-000000000010	2025-12	2	Menjamin kesiapan operasional alat pendukung darat	Meningkatkan GSE (Ground Support Equipment) Serviceability Rate	88	96	%	0.2	Max	No. 2 Asset Integrity & Parts Traceability Index	1. Jadwal perawatan preventif bulanan untuk semua towing truck dan GPU.	GSE yang siap pakai adalah syarat OTP dan keselamatan ground handling.	2026-03-09 04:16:25.935595
6b413e1f-8f2f-417d-bba0-03ee2e9a0e61	unit	00000000-0000-0000-0000-000000000010	2025-12	3	Optimalisasi produktivitas dan efisiensi tenaga teknisi	Meningkatkan Man-Hour Utilization per Job Card	75	85	%	0.2	Max	No. 4 Maintenance Cost & Resource Efficiency	1. Pemetaan skill teknisi agar penugasan sesuai dengan spesialisasi mesin/avionik.	Produktivitas teknisi langsung mempengaruhi biaya maintenance per flight hour.	2026-03-09 04:16:25.935595
c28d97ca-6aba-43c7-af88-9b14049565c3	unit	00000000-0000-0000-0000-000000000010	2025-12	4	Menjaga standar keselamatan kerja dan lingkungan hangar	Mencapai Zero Workplace Accident & Environmental Findings	2	0	Findings	0.2	Min	No. 6 Safety & Quality Management Excellence	1. Pelaksanaan Daily Safety Briefing sebelum memulai pekerjaan di hangar.	Zero accident adalah standar mutlak; setiap insiden berpotensi menghentikan operasi.	2026-03-09 04:16:25.935595
e1c4bc00-eb14-4ab7-b11b-2312bc0318af	unit	00000000-0000-0000-0000-000000000010	2025-12	5	Digitalisasi catatan pekerjaan teknik secara real-time	Meningkatkan e-Logbook Entry Accuracy Rate	70	98	%	0.15	Max	No. 5 Engineering Digitalization & Data Integrity	1. Input data hasil pengecekan langsung di samping pesawat via tablet.	Akurasi logbook digital adalah dasar kelaikan pesawat dan traceability.	2026-03-09 04:16:25.935595
\.


--
-- Data for Name: upload_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.upload_logs (id, filename, entity_type, dept_id, period, items_parsed, actuals_parsed, status, error_message, uploaded_by, uploaded_at) FROM stdin;
4c3f3995-b070-4dbd-a9a3-7c2eddb4f051	excel-upload	corporate	00000000-0000-0000-0000-000000000001	2025-12	8	0	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-07 09:55:45.954824
719c54a1-4f4f-4b39-8405-0987ae6964a7	excel-upload	corporate	00000000-0000-0000-0000-000000000001	2025-12	8	8	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-07 10:16:22.218778
64e94997-c1b5-4b22-b2bb-c5389e219a81	excel-upload	department	00000000-0000-0000-0000-000000000005	2025-12	7	7	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-07 10:17:32.774715
1b88ebcd-3403-4e20-b9bc-74c60361657e	excel-upload	corporate	00000000-0000-0000-0000-000000000001	2025-12	8	8	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:26.46812
4a55f051-7f9f-45c8-82da-be99f92e5883	excel-upload	department	00000000-0000-0000-0000-000000000005	2025-12	7	7	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:07:56.477128
5f43e697-892e-4558-bfbc-6aa553fe8ef5	excel-upload	department	00000000-0000-0000-0000-000000000004	2025-12	7	7	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:09.367373
28d958b1-33e8-4618-a5f4-700cda759f29	excel-upload	department	00000000-0000-0000-0000-000000000003	2025-12	8	8	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:28.407769
7536f6aa-c3b6-42c7-891a-8d903cf3048c	excel-upload	department	00000000-0000-0000-0000-000000000002	2025-12	6	6	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:08:45.349688
a6652744-5940-4253-ace7-5d20cb954e6a	excel-upload	unit	00000000-0000-0000-0000-000000000010	2025-12	5	0	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:09.992253
fa73a90c-6492-4850-996d-a3d566237131	excel-upload	unit	00000000-0000-0000-0000-000000000011	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:22.224591
208a5d0e-2b07-45dd-bb0e-d61fe38e1f9d	excel-upload	unit	00000000-0000-0000-0000-000000000012	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:33.176313
36f64714-30da-48be-b7bc-7c790242b2b8	excel-upload	unit	00000000-0000-0000-0000-000000000020	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:09:50.624351
3d314a66-0d56-414b-b46e-32c9a6992278	excel-upload	unit	00000000-0000-0000-0000-000000000021	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:00.472109
987ab55a-9e36-4e7d-8784-1baf1d1e4b08	excel-upload	unit	00000000-0000-0000-0000-000000000021	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:12.480084
646e69f0-03b5-4384-9ab3-b0ba88967166	excel-upload	unit	00000000-0000-0000-0000-000000000021	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:10:26.328769
9bad959c-e611-4a5b-821a-8b3b3ec0fcf0	excel-upload	unit	00000000-0000-0000-0000-000000000030	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:14.69497
b2a8311c-d927-4c7c-a3f7-d6579c51458d	excel-upload	unit	00000000-0000-0000-0000-000000000030	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:23.543182
931322c8-979c-4793-9cec-d688e18dbbd9	excel-upload	unit	00000000-0000-0000-0000-000000000032	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:34.055322
2fa4fb3c-68c2-46ab-a0fc-99ec5410a61e	excel-upload	unit	00000000-0000-0000-0000-000000000040	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:11:49.04759
92ab2675-f36d-4ad6-a99a-902a345c5133	excel-upload	corporate	00000000-0000-0000-0000-000000000001	2025-12	8	8	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 02:22:18.655032
8b02ba05-9eaf-49b1-9f33-95c2932fcfb6	excel-upload	unit	00000000-0000-0000-0000-000000000010	2025-12	5	5	success	\N	6f15f112-aeee-4928-bc3f-1d19be87cae4	2026-03-09 04:16:25.935595
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
4120a306-a706-470d-8320-f0e0006732dd	Salomo Polanco	salomo@garuda.com	$2a$12$zjPLz.OZ9iEw8e/amGrUJOsUD40xYRJshI3bngJwZtTRZF/qN57Bu	corporate_planning	t	2026-03-07 05:49:42.471406	2026-03-07 05:49:42.471406
6f15f112-aeee-4928-bc3f-1d19be87cae4	System Admin	admin@garuda.com	$2a$12$kP5aZszJvqVTtyjeQBc0getdQ9n7fTNP2QA5MPP0c9W3qV5Ml0hzG	admin	t	2026-03-07 04:36:35.14509	2026-03-07 04:36:35.14509
64afb9f8-49d6-4ad0-ab77-23207c8421a8	Lionel Messi	messi@garuda.com	$2a$12$QD5YGo2z0g3Z4iu5dlbT9.aF0J.QzXdlbPZJUZCPjSEiuDF9oE7Sa	direksi	t	2026-03-07 09:51:06.453768	2026-03-07 09:51:06.453768
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-03-07 04:21:01
20211116045059	2026-03-07 04:23:32
20211116050929	2026-03-07 04:23:33
20211116051442	2026-03-07 04:23:34
20211116212300	2026-03-07 04:23:35
20211116213355	2026-03-07 04:24:41
20211116213934	2026-03-07 04:24:42
20211116214523	2026-03-07 04:24:43
20211122062447	2026-03-07 04:24:44
20211124070109	2026-03-07 04:24:44
20211202204204	2026-03-07 04:24:45
20211202204605	2026-03-07 04:24:46
20211210212804	2026-03-07 04:24:48
20211228014915	2026-03-07 04:24:49
20220107221237	2026-03-07 04:24:49
20220228202821	2026-03-07 04:24:50
20220312004840	2026-03-07 04:24:51
20220603231003	2026-03-07 04:24:52
20220603232444	2026-03-07 04:24:52
20220615214548	2026-03-07 04:24:53
20220712093339	2026-03-07 04:24:54
20220908172859	2026-03-07 04:24:55
20220916233421	2026-03-07 04:24:55
20230119133233	2026-03-07 04:24:56
20230128025114	2026-03-07 04:24:57
20230128025212	2026-03-07 04:24:58
20230227211149	2026-03-07 04:24:58
20230228184745	2026-03-07 04:24:59
20230308225145	2026-03-07 04:25:00
20230328144023	2026-03-07 04:25:01
20231018144023	2026-03-07 04:25:01
20231204144023	2026-03-07 04:25:02
20231204144024	2026-03-07 04:25:03
20231204144025	2026-03-07 04:25:04
20240108234812	2026-03-07 04:25:05
20240109165339	2026-03-07 04:25:05
20240227174441	2026-03-07 04:25:06
20240311171622	2026-03-07 04:25:07
20240321100241	2026-03-07 04:25:09
20240401105812	2026-03-07 04:25:11
20240418121054	2026-03-07 04:25:12
20240523004032	2026-03-07 04:25:14
20240618124746	2026-03-07 04:25:15
20240801235015	2026-03-07 04:25:16
20240805133720	2026-03-07 04:25:16
20240827160934	2026-03-07 04:25:17
20240919163303	2026-03-07 04:25:18
20240919163305	2026-03-07 04:25:19
20241019105805	2026-03-07 04:25:19
20241030150047	2026-03-07 04:25:22
20241108114728	2026-03-07 04:25:23
20241121104152	2026-03-07 04:25:24
20241130184212	2026-03-07 04:25:25
20241220035512	2026-03-07 04:25:25
20241220123912	2026-03-07 04:25:26
20241224161212	2026-03-07 04:25:27
20250107150512	2026-03-07 04:25:27
20250110162412	2026-03-07 04:25:28
20250123174212	2026-03-07 04:25:29
20250128220012	2026-03-07 04:25:29
20250506224012	2026-03-07 04:25:30
20250523164012	2026-03-07 04:25:31
20250714121412	2026-03-07 04:25:31
20250905041441	2026-03-07 04:25:32
20251103001201	2026-03-07 04:25:33
20251120212548	2026-03-07 04:25:34
20251120215549	2026-03-07 04:25:34
20260218120000	2026-03-07 04:25:35
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-03-07 04:21:00.364748
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-03-07 04:21:00.993309
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-03-07 04:27:19.496188
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-03-07 04:27:19.519412
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-03-07 04:27:19.566591
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-03-07 04:27:19.57572
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-03-07 04:27:19.585356
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-03-07 04:27:19.596195
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-03-07 04:27:19.605609
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-03-07 04:27:19.615115
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-03-07 04:27:19.62473
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-03-07 04:27:19.634391
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-03-07 04:27:19.644505
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-03-07 04:27:19.653735
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-03-07 04:27:19.663749
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-03-07 04:27:19.694527
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-03-07 04:27:19.703581
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-03-07 04:27:19.712424
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-03-07 04:27:19.721127
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-03-07 04:27:19.731261
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-03-07 04:27:19.740494
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-03-07 04:27:19.750224
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-03-07 04:27:19.768551
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-03-07 04:27:19.78374
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-03-07 04:27:19.792986
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-03-07 04:27:19.802188
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-03-07 04:27:19.811622
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-03-07 04:27:19.820647
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-03-07 04:27:19.829195
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-03-07 04:27:19.837634
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-03-07 04:27:19.846305
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-03-07 04:27:19.855042
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-03-07 04:27:19.864212
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-03-07 04:27:19.873456
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-03-07 04:27:19.88223
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-03-07 04:27:19.89102
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-03-07 04:27:19.899525
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-03-07 04:27:19.907957
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-03-07 04:27:19.917646
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-03-07 04:27:19.931581
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-03-07 04:27:19.940166
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-03-07 04:27:19.94913
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-03-07 04:27:19.95777
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-03-07 04:27:19.966505
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-03-07 04:27:19.975145
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-03-07 04:27:19.984506
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-03-07 04:27:19.998915
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-03-07 04:27:20.008499
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-03-07 04:27:20.017604
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-03-07 04:27:20.036695
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-03-07 04:27:20.046402
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-03-07 04:27:20.40368
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-03-07 04:27:20.406887
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-03-07 04:27:20.42537
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-03-07 04:27:20.430527
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-03-07 04:27:20.433691
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-03-07 04:27:20.444892
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: analysis_drafts analysis_drafts_dept_id_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_drafts
    ADD CONSTRAINT analysis_drafts_dept_id_period_key UNIQUE (dept_id, period);


--
-- Name: analysis_drafts analysis_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_drafts
    ADD CONSTRAINT analysis_drafts_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: external_data external_data_period_data_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_data
    ADD CONSTRAINT external_data_period_data_type_key UNIQUE (period, data_type);


--
-- Name: external_data external_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_data
    ADD CONSTRAINT external_data_pkey PRIMARY KEY (id);


--
-- Name: kpi_actuals kpi_actuals_kpi_item_id_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_actuals
    ADD CONSTRAINT kpi_actuals_kpi_item_id_period_key UNIQUE (kpi_item_id, period);


--
-- Name: kpi_actuals kpi_actuals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_actuals
    ADD CONSTRAINT kpi_actuals_pkey PRIMARY KEY (id);


--
-- Name: kpi_dictionary kpi_dictionary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_dictionary
    ADD CONSTRAINT kpi_dictionary_pkey PRIMARY KEY (id);


--
-- Name: kpi_items kpi_items_dept_id_period_action_verb_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_items
    ADD CONSTRAINT kpi_items_dept_id_period_action_verb_key UNIQUE (dept_id, period, action_verb);


--
-- Name: kpi_items kpi_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_items
    ADD CONSTRAINT kpi_items_pkey PRIMARY KEY (id);


--
-- Name: upload_logs upload_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_logs
    ADD CONSTRAINT upload_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_analysis_dept_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_dept_period ON public.analysis_drafts USING btree (dept_id, period);


--
-- Name: idx_external_data_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_data_period ON public.external_data USING btree (period);


--
-- Name: idx_external_data_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_data_type ON public.external_data USING btree (period, data_type);


--
-- Name: idx_kpi_actuals_item_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_actuals_item_period ON public.kpi_actuals USING btree (kpi_item_id, period);


--
-- Name: idx_kpi_items_dept_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_items_dept_period ON public.kpi_items USING btree (dept_id, period);


--
-- Name: idx_kpi_items_entity_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_items_entity_period ON public.kpi_items USING btree (entity_type, period);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: analysis_drafts analysis_drafts_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_drafts
    ADD CONSTRAINT analysis_drafts_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: analysis_drafts analysis_drafts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_drafts
    ADD CONSTRAINT analysis_drafts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: analysis_drafts analysis_drafts_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_drafts
    ADD CONSTRAINT analysis_drafts_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(id);


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id);


--
-- Name: external_data external_data_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_data
    ADD CONSTRAINT external_data_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: kpi_actuals kpi_actuals_input_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_actuals
    ADD CONSTRAINT kpi_actuals_input_by_fkey FOREIGN KEY (input_by) REFERENCES public.users(id);


--
-- Name: kpi_actuals kpi_actuals_kpi_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_actuals
    ADD CONSTRAINT kpi_actuals_kpi_item_id_fkey FOREIGN KEY (kpi_item_id) REFERENCES public.kpi_items(id) ON DELETE CASCADE;


--
-- Name: kpi_items kpi_items_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_items
    ADD CONSTRAINT kpi_items_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(id);


--
-- Name: upload_logs upload_logs_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_logs
    ADD CONSTRAINT upload_logs_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.departments(id);


--
-- Name: upload_logs upload_logs_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_logs
    ADD CONSTRAINT upload_logs_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: analysis_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analysis_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: external_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_data ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_actuals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_actuals ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_dictionary; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_dictionary ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_items ENABLE ROW LEVEL SECURITY;

--
-- Name: upload_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict ihD18VGLbYYoIAlhcNgQla4F9cZeOePwF6RC13DLvvE7l3V2MiDwIrmjrZEPDP4

